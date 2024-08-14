import proj4 from "proj4";
import { useState, useEffect } from "react";

export type UtmCoordinates = {
  easting_prefix: number | null;
  northing_prefix: number | null;
  zone: number | null;
  hemisphere: string | null;
};

export default function useUserCoordinate() {
  const [utmCoordinates, setUtmCoordinates] = useState<UtmCoordinates>({
    easting_prefix: null,
    northing_prefix: null,
    zone: null,
    hemisphere: null,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Calcul de la zone UTM
          const zone = getUtmZone(longitude);
          const hemisphere = latitude >= 0 ? "N" : "S";

          // Convertir en UTM
          const utm = proj4(
            "EPSG:4326",
            `+proj=utm +zone=${zone} +${hemisphere === "N" ? "" : "south "}`,
            [longitude, latitude]
          );

          setUtmCoordinates({
            easting_prefix: Math.floor(utm[0] / 100000),
            northing_prefix: Math.floor(utm[1] / 100000),
            zone,
            hemisphere,
          });
        },
        (error) => {
          console.error("Error getting location: ", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  function getUtmZone(longitude: number) {
    return Math.floor((longitude + 180) / 6) + 1;
  }

  return { utmCoordinates, setUtmCoordinates };
}
