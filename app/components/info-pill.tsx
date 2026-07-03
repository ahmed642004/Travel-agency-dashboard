import React from "react";

const InfoPill = ({ text, image }: InfoPillProps) => {
  return (
    <figure className="info-pill">
      <img src={image} alt="Info Icon" />
      <figcaption>{text}</figcaption>
    </figure>
  );
};
export default InfoPill;
