import proj4 from "proj4";
import { useState } from "react";

// Définir la projection UTM pour la zone 31N
proj4.defs("EPSG:32631", "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs");

const UTMToWazeConverter = () => {
  const [zone, setZone] = useState<string>("31N");
  const [easting, setEasting] = useState<string>("485191");
  const [northing, setNorthing] = useState<string>("5529491");
  const [wazeLink, setWazeLink] = useState<string>("");

  const utmToLatLng = (zone: string, easting: string, northing: string) => {
    const zoneNumber = zone.substring(0, zone.length - 1); // Extrait la partie numérique de la zone UTM
    // const hemisphere = zone[zone.length - 1].toUpperCase(); // N ou S pour hémisphère Nord ou Sud
    const epsgCode = `EPSG:326${zoneNumber}`; // Système de coordonnées UTM pour l'hémisphère Nord

    const utmCoords = [Number(easting), Number(northing)];
    const latLng = proj4(epsgCode, "EPSG:4326", utmCoords);

    return {
      lat: latLng[1],
      lng: latLng[0],
    };
  };

  const convertUTMtoWaze = () => {
    if (!zone || !easting || !northing) {
      alert("Veuillez entrer toutes les coordonnées UTM.");
      return;
    }

    const coords = utmToLatLng(zone, easting, northing);
    const link = `https://www.waze.com/ul?ll=${coords.lat},${coords.lng}&navigate=yes`;

    setWazeLink(link);
  };

  return (
    <div className="container">
      <h2>Convertisseur de coordonnées UTM vers lien Waze</h2>
      <input
        type="text"
        value={zone}
        onChange={(e) => setZone(e.target.value)}
        placeholder="Zone UTM (ex: 33T)"
      />
      <input
        type="text"
        value={easting}
        onChange={(e) => setEasting(e.target.value)}
        placeholder="Easting (ex: 500000)"
      />
      <input
        type="text"
        value={northing}
        onChange={(e) => setNorthing(e.target.value)}
        placeholder="Northing (ex: 4649776)"
      />
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
    </div>
  );
};

export default UTMToWazeConverter;
