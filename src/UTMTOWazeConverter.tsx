import proj4 from "proj4";
import { useEffect, useState } from "react";
import useUserCoordinate, { UtmCoordinates } from "./useUserCoordinate";

interface Waypoint {
  id: string;
  name: string;
  easting: string;
  northing: string;
  wazeLink: string;
  easting_prefix: number;
  northing_prefix: number;
}

const UTMToWazeConverter = () => {
  const { utmCoordinates, setEastingPrefix, setNorthingPrefix, setZone } =
    useUserCoordinate();
  const { easting_prefix, northing_prefix, zone } = utmCoordinates;
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [newWaypoint, setNewWaypoint] = useState({
    name: "",
    easting: "",
    northing: "",
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWaypoint, setEditingWaypoint] = useState<Waypoint | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    easting: "",
    northing: "",
    easting_prefix: 0,
    northing_prefix: 0,
  });

  // Load waypoints from localStorage on component mount
  useEffect(() => {
    const savedWaypoints = localStorage.getItem("utm-waypoints");
    if (savedWaypoints) {
      try {
        setWaypoints(JSON.parse(savedWaypoints));
      } catch (error) {
        console.error("Error parsing saved waypoints:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save waypoints to localStorage whenever waypoints change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("utm-waypoints", JSON.stringify(waypoints));
    }
  }, [waypoints, isLoaded]);

  const utmToLatLng = (
    utmCoordinates: UtmCoordinates,
    easting: string,
    northing: string
  ) => {
    const epsgCode = `EPSG:326${utmCoordinates.zone}`; // Système de coordonnées UTM pour l'hémisphère Nord

    // Définir dynamiquement la projection UTM pour la zone demandée
    if (!proj4.defs(epsgCode)) {
      proj4.defs(
        epsgCode,
        `+proj=utm +zone=${utmCoordinates.zone} +datum=WGS84 +units=m +no_defs`
      );
    }

    const utmCoords = [
      Number(utmCoordinates.easting_prefix + easting + "0"),
      Number(utmCoordinates.northing_prefix + northing + "0"),
    ];
    try {
      const latLng = proj4(epsgCode, "EPSG:4326", utmCoords);
      return {
        lat: latLng[1],
        lng: latLng[0],
      };
    } catch (error) {
      console.error(error);
      alert(
        `Erreur lors de la conversion des coordonnées UTM en coordonnées WGS84, ${
          (error as Error).message
        }`
      );
    }
  };

  const addWaypoint = () => {
    if (
      !utmCoordinates ||
      !newWaypoint.easting ||
      !newWaypoint.northing ||
      !newWaypoint.name
    ) {
      alert(
        "Veuillez entrer toutes les informations du waypoint (nom, easting, northing)."
      );
      return;
    }
    if (!easting_prefix || !northing_prefix) {
      alert("Should define zone prefix");
    }

    const coords = utmToLatLng(
      utmCoordinates,
      newWaypoint.easting,
      newWaypoint.northing
    );
    if (!coords) return;

    const wazeLink = `https://www.waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`;
    const waypoint: Waypoint = {
      id: Date.now().toString(),
      name: newWaypoint.name,
      easting: newWaypoint.easting,
      northing: newWaypoint.northing,
      easting_prefix: easting_prefix || 0,
      northing_prefix: northing_prefix || 0,
      wazeLink,
    };

    setWaypoints([...waypoints, waypoint]);
    setNewWaypoint({ name: "", easting: "", northing: "" });
    setShowAddModal(false);
  };

  const deleteAllWaypoints = () => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer tous les waypoints ?")
    ) {
      setWaypoints([]);
    }
  };

  const removeWaypoint = (id: string) => {
    setWaypoints(waypoints.filter((wp) => wp.id !== id));
  };

  const editWaypoint = (waypoint: Waypoint) => {
    setEditingWaypoint(waypoint);
    setEditForm({
      name: waypoint.name,
      easting: waypoint.easting,
      northing: waypoint.northing,
      easting_prefix: waypoint.easting_prefix,
      northing_prefix: waypoint.northing_prefix,
    });
    setShowEditModal(true);
  };

  const updateWaypoint = () => {
    if (
      !editForm.name ||
      !editForm.easting ||
      !editForm.northing ||
      !editingWaypoint
    ) {
      alert("Veuillez entrer toutes les informations du waypoint.");
      return;
    }

    const coords = utmToLatLng(
      {
        ...utmCoordinates,
        easting_prefix: editForm.easting_prefix,
        northing_prefix: editForm.northing_prefix,
      },
      editForm.easting,
      editForm.northing
    );
    if (!coords) return;

    const wazeLink = `https://www.waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`;

    const updatedWaypoint: Waypoint = {
      ...editingWaypoint,
      name: editForm.name,
      easting: editForm.easting,
      northing: editForm.northing,
      easting_prefix: editForm.easting_prefix,
      northing_prefix: editForm.northing_prefix,
      wazeLink,
    };

    setWaypoints(
      waypoints.map((wp) =>
        wp.id === editingWaypoint.id ? updatedWaypoint : wp
      )
    );

    setShowEditModal(false);
    setEditingWaypoint(null);
    setEditForm({
      name: "",
      easting: "",
      northing: "",
      easting_prefix: 0,
      northing_prefix: 0,
    });
  };

  const openInWaze = (wazeLink: string) => {
    window.open(wazeLink, "_blank");
  };

  const copyAllLinks = () => {
    const linksText = waypoints
      .map((wp) => `${wp.name}: ${wp.wazeLink}`)
      .join("\n");

    navigator.clipboard
      .writeText(linksText)
      .then(() => {
        alert("Tous les liens ont été copiés dans le presse-papiers!");
      })
      .catch(() => {
        alert("Erreur lors de la copie des liens.");
      });
  };

  const copyWaypointLink = (waypoint: Waypoint) => {
    navigator.clipboard.writeText(waypoint.wazeLink);
  };

  return (
    <div className="container">
      <div className="header">
        <h2>UTM vers Waze</h2>
        <div className="main-actions">
          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="add-waypoint-btn"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Add Waypoint Modal */}
      {showAddModal && (
        <div className="settings-dropdown">
          <h3>Add a waypoint</h3>
          <button
            className="add-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            <svg
              width="20px"
              height="20px"
              viewBox="0 0 8.4666669 8.4666669"
              id="svg8"
            >
              <defs id="defs2" />

              <g id="layer1" transform="translate(0,-288.53332)">
                <path
                  d="m 3.7041666,288.7979 a 0.26460976,0.26460976 0 0 0 -0.2511475,0.18087 l -0.2687174,0.80615 c -0.1084927,0.0382 -0.2146168,0.082 -0.3183269,0.13178 l -0.7601602,-0.37982 a 0.26460976,0.26460976 0 0 0 -0.3054077,0.0496 l -0.7482748,0.74827 a 0.26460976,0.26460976 0 0 0 -0.049609,0.30541 l 0.379305,0.75861 c -0.049895,0.10423 -0.094048,0.21083 -0.1322917,0.31988 l -0.80511879,0.26871 a 0.26460976,0.26460976 0 0 0 -0.18086751,0.25115 v 1.05833 a 0.26460976,0.26460976 0 0 0 0.18086751,0.25115 l 0.80770259,0.26924 c 0.038069,0.10784 0.081782,0.21314 0.1312582,0.31625 l -0.3808553,0.76172 a 0.26460976,0.26460976 0 0 0 0.049609,0.3054 l 0.7482748,0.74879 a 0.26460976,0.26460976 0 0 0 0.3054077,0.0496 l 0.7601602,-0.38033 c 0.1036035,0.0495 0.209454,0.0932 0.3178101,0.13125 l 0.2692342,0.80719 a 0.26460976,0.26460976 0 0 0 0.2511475,0.18087 h 1.0583333 a 0.26460976,0.26460976 0 0 0 0.2511476,-0.18087 l 0.2692341,-0.80874 c 0.1075521,-0.0379 0.2128936,-0.0815 0.3157429,-0.13074 l 0.7622276,0.38137 a 0.26460976,0.26460976 0 0 0 0.3054074,-0.0496 l 0.748275,-0.74879 a 0.26460976,0.26460976 0 0 0 0.049609,-0.3054 l -0.3798218,-0.75965 c 0.049789,-0.10387 0.093561,-0.21018 0.1317749,-0.31884 L 8.0222491,293.548 a 0.26460976,0.26460976 0 0 0 0.1808676,-0.25115 v -1.05833 a 0.26460976,0.26460976 0 0 0 -0.1808676,-0.25115 l -0.806669,-0.26871 c -0.038193,-0.10832 -0.082077,-0.21427 -0.1317747,-0.31781 l 0.3803385,-0.76068 a 0.26460976,0.26460976 0 0 0 -0.049609,-0.30541 l -0.748275,-0.74827 a 0.26460976,0.26460976 0 0 0 -0.3054074,-0.0496 l -0.7580934,0.37878 c -0.1045763,-0.05 -0.2115013,-0.094 -0.3209105,-0.13229 l -0.2682007,-0.8046 a 0.26460976,0.26460976 0 0 0 -0.251148,-0.18088 z m 0.190686,0.52917 h 0.6769613 l 0.245463,0.73691 a 0.26460976,0.26460976 0 0 0 0.1757,0.17001 c 0.1722022,0.0512 0.3388331,0.11967 0.4971272,0.20464 a 0.26460976,0.26460976 0 0 0 0.243396,0.004 l 0.6934978,-0.34675 0.4785236,0.47852 -0.3482991,0.6966 a 0.26460976,0.26460976 0 0 0 0.00362,0.24391 c 0.084769,0.15725 0.1537229,0.32244 0.2051555,0.49351 a 0.26460976,0.26460976 0 0 0 0.1694987,0.17519 l 0.738456,0.24598 v 0.67696 l -0.7379393,0.24598 a 0.26460976,0.26460976 0 0 0 -0.1694987,0.17518 c -0.051373,0.1714 -0.1203285,0.337 -0.2051555,0.49454 a 0.26460976,0.26460976 0 0 0 -0.00362,0.24392 l 0.3477824,0.69556 -0.4785236,0.47904 -0.6981486,-0.34933 a 0.26460976,0.26460976 0 0 0 -0.2439128,0.004 c -0.1566825,0.0843 -0.3210488,0.15287 -0.4914429,0.20412 a 0.26460976,0.26460976 0 0 0 -0.175183,0.1695 l -0.2464967,0.74052 H 3.8948526 l -0.2464967,-0.73949 a 0.26460976,0.26460976 0 0 0 -0.175183,-0.17001 c -0.1710385,-0.0511 -0.3367447,-0.11916 -0.4940265,-0.20361 a 0.26460976,0.26460976 0 0 0 -0.243396,-0.004 l -0.6960816,0.3483 -0.4785238,-0.47904 0.3488159,-0.69763 a 0.26460976,0.26460976 0 0 0 -0.00362,-0.24391 c -0.08452,-0.15682 -0.1532676,-0.32191 -0.2046387,-0.49248 a 0.26460976,0.26460976 0 0 0 -0.1694987,-0.17467 l -0.73948973,-0.24649 v -0.67696 l 0.73742263,-0.24598 a 0.26460976,0.26460976 0 0 0 0.1700155,-0.17519 c 0.051313,-0.17172 0.1197532,-0.33773 0.2046387,-0.49557 a 0.26460976,0.26460976 0 0 0 0.00362,-0.24392 l -0.3472656,-0.69453 0.4785238,-0.47852 0.6960816,0.34778 a 0.26460976,0.26460976 0 0 0 0.2439127,-0.004 c 0.1573948,-0.0848 0.3227911,-0.15375 0.4940266,-0.20515 a 0.26460976,0.26460976 0 0 0 0.1751832,-0.1695 z"
                  id="path940"
                />

                <path
                  d="m 4.2324219,290.91406 c -1.0197435,0 -1.8515625,0.83377 -1.8515625,1.85352 0,1.01974 0.831819,1.85156 1.8515625,1.85156 1.0197434,0 1.8535156,-0.83182 1.8535156,-1.85156 0,-1.01975 -0.8337722,-1.85352 -1.8535156,-1.85352 z m 0,0.5293 c 0.7337606,0 1.3242187,0.59046 1.3242187,1.32422 0,0.73376 -0.5904581,1.32226 -1.3242187,1.32226 -0.7337606,0 -1.3222657,-0.5885 -1.3222657,-1.32226 0,-0.73376 0.5885051,-1.32422 1.3222657,-1.32422 z"
                  id="path961"
                />
              </g>
            </svg>
          </button>
          {/* Settings Dropdown */}
          {showSettings && (
            <div className="settings-dropdown">
              <h3>Paramètres UTM</h3>
              <div className="settings-inputs">
                <div>
                  <label>Zone UTM</label>
                  <input
                    type="text"
                    value={zone ? String(zone) : ""}
                    onChange={(e) => setZone(Number(e.target.value))}
                    placeholder="Zone UTM (ex: 31)"
                  />
                </div>
                <div>
                  <label>Easting prefix</label>
                  <input
                    type="text"
                    value={easting_prefix ? String(easting_prefix) : ""}
                    onChange={(e) => setEastingPrefix(Number(e.target.value))}
                    placeholder="Easting prefix (ex: 4)"
                  />
                </div>
                <div>
                  <label>Northing prefix</label>
                  <input
                    type="text"
                    value={northing_prefix ? String(northing_prefix) : ""}
                    onChange={(e) => setNorthingPrefix(Number(e.target.value))}
                    placeholder="Northing prefix (ex: 55)"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="close-settings-btn"
              >
                Fermer
              </button>
            </div>
          )}
          <div className="settings-inputs">
            <div className="waypoint-inputs">
              <input
                type="text"
                value={newWaypoint.name}
                onChange={(e) =>
                  setNewWaypoint({ ...newWaypoint, name: e.target.value })
                }
                placeholder="Nom du waypoint"
              />
              <input
                type="text"
                value={newWaypoint.easting}
                minLength={4}
                maxLength={4}
                onChange={(e) =>
                  setNewWaypoint({ ...newWaypoint, easting: e.target.value })
                }
                placeholder="Easting (ex: 0450)"
              />
              <input
                type="text"
                value={newWaypoint.northing}
                minLength={4}
                maxLength={4}
                onChange={(e) =>
                  setNewWaypoint({ ...newWaypoint, northing: e.target.value })
                }
                placeholder="Northing (ex: 8912)"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowAddModal(false)}
                className="cancel-btn"
              >
                Annuler
              </button>
              <button onClick={addWaypoint} className="confirm-btn">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Waypoint Modal */}
      {showEditModal && editingWaypoint && (
        <div className="settings-dropdown">
          <h3>Modifier le waypoint</h3>
          <div className="settings-inputs">
            <div className="waypoint-inputs">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Nom du waypoint"
              />
              <input
                type="text"
                value={editForm.easting_prefix}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    easting_prefix: Number(e.target.value),
                  })
                }
                placeholder="Easting prefix (ex: 4)"
              />
              <input
                type="text"
                value={editForm.easting}
                minLength={4}
                maxLength={4}
                onChange={(e) =>
                  setEditForm({ ...editForm, easting: e.target.value })
                }
                placeholder="Easting (ex: 0450)"
              />
              <input
                type="text"
                value={editForm.northing_prefix}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    northing_prefix: Number(e.target.value),
                  })
                }
                placeholder="Northing prefix (ex: 55)"
              />
              <input
                type="text"
                value={editForm.northing}
                minLength={4}
                maxLength={4}
                onChange={(e) =>
                  setEditForm({ ...editForm, northing: e.target.value })
                }
                placeholder="Northing (ex: 8912)"
              />
            </div>
            <div className="modal-actions">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingWaypoint(null);
                  setEditForm({
                    name: "",
                    easting: "",
                    northing: "",
                    easting_prefix: 0,
                    northing_prefix: 0,
                  });
                }}
                className="cancel-btn"
              >
                Annuler
              </button>
              <button onClick={updateWaypoint} className="confirm-btn">
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waypoints list */}
      {waypoints.length > 0 && (
        <div className="waypoints-list">
          <div className="waypoints-header">
            <h3>Waypoints ({waypoints.length})</h3>
            <div className="header-actions">
              <button onClick={deleteAllWaypoints} className="delete-all-btn">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Tout supprimer
              </button>
              <button onClick={copyAllLinks} className="copy-all-btn">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copier tous
              </button>
            </div>
          </div>

          {waypoints.map((waypoint) => (
            <div key={waypoint.id} className="waypoint-item">
              <div className="waypoint-info">
                <strong>{waypoint.name}</strong>
                <span>
                  E: {waypoint.easting_prefix}
                  {waypoint.easting}0 N: {waypoint.northing_prefix}
                  {waypoint.northing}0
                </span>
              </div>
              <div className="waypoint-actions">
                <button
                  className="copy-btn"
                  onClick={() => editWaypoint(waypoint)}
                >
                  Edit
                </button>
                <button
                  onClick={() => removeWaypoint(waypoint.id)}
                  className="remove-btn"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
                <button
                  onClick={() => copyWaypointLink(waypoint)}
                  className="copy-btn"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
                <button
                  onClick={() => openInWaze(waypoint.wazeLink)}
                  className="waze-btn"
                >
                  <img src="waze.png" alt="Waze" height={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="gavotte">
        Cette solution vous est proposé par
        <img src="Gavottes.png" alt="Gavottes" height={100} />
      </div>
    </div>
  );
};

export default UTMToWazeConverter;
