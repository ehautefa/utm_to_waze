import { useState } from "react";

export default function LinkWithCopy({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Réinitialise l'état après 2 secondes
      },
      (err) => {
        console.error("Erreur lors de la copie : ", err);
      }
    );
  };

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <a href={link} target="_blank" rel="noopener noreferrer">
        Ouvrir avec waze
      </a>
      <button onClick={handleCopy} style={{ marginLeft: "10px" }}>
        {copied ? "Lien copié!" : "Copier le lien"}
      </button>
    </div>
  );
}
