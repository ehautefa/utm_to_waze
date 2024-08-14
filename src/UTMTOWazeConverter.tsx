import proj4 from "proj4";
import { useState } from "react";
import useUserCoordinate, { UtmCoordinates } from "./useUserCoordinate";

// Définir la projection UTM pour la zone 31N
proj4.defs("EPSG:32631", "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs");

const UTMToWazeConverter = () => {
  const { utmCoordinates, setEastingPrefix, setNorthingPrefix, setZone } =
    useUserCoordinate();
  const { easting_prefix, northing_prefix, zone } = utmCoordinates;
  const [easting, setEasting] = useState<string>("");
  const [northing, setNorthing] = useState<string>("");
  const [wazeLink, setWazeLink] = useState<string>("");

  const utmToLatLng = (
    utmCoordinates: UtmCoordinates,
    easting: string,
    northing: string
  ) => {
    const epsgCode = `EPSG:326${utmCoordinates.zone}`; // Système de coordonnées UTM pour l'hémisphère Nord
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
      alert(
        `Erreur lors de la conversion des coordonnées UTM en coordonnées WGS84, ${
          (error as Error).message
        }`
      );
    }
  };

  const convertUTMtoWaze = () => {
    if (!utmCoordinates || !easting || !northing) {
      alert("Veuillez entrer toutes les coordonnées UTM.");
      return;
    }

    const coords = utmToLatLng(utmCoordinates, easting, northing);
    if (!coords) return;
    const link = `https://www.waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`;

    setWazeLink(link);
  };

  return (
    <div className="container">
      <h2>Convertisseur de coordonnées UTM vers lien Waze</h2>
      <div className="flex-container">
        <div>
          <label>Zone</label>
          <input
            type="text"
            value={zone ? String(zone) : ""}
            onChange={(e) => setZone(Number(e.target.value))}
            placeholder="Zone UTM (ex: 33)"
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
      <div className="utm-inputs">
        <input
          type="text"
          value={easting}
          minLength={4}
          maxLength={4}
          onChange={(e) => setEasting(e.target.value)}
          placeholder="Easting (ex: 0450)"
        />
        <input
          type="text"
          value={northing}
          minLength={4}
          maxLength={4}
          onChange={(e) => setNorthing(e.target.value)}
          placeholder="Northing (ex: 8912)"
        />
      </div>
      <button onClick={convertUTMtoWaze}>Convertir en lien Waze</button>
      {wazeLink && (
        <div id="result" style={{ marginTop: "20px" }}>
          <p>
            <a href={wazeLink} target="_blank" rel="noopener noreferrer">
              Lien waze
            </a>
          </p>
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
