import React, { useState, ReactNode } from "react";
import { Moment } from "@/models/models";

type MapContextType = {
  selectedPoint: Moment | null;
  setSelectedPoint: (point: Moment | null) => void;
};

const MapContext = React.createContext<MapContextType>({
  selectedPoint: null,
  setSelectedPoint: () => {},
});

type MapProviderProps = {
  children: ReactNode;
};

const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [selectedPoint, setSelectedPoint] = useState<Moment | null>(null);
  const handleSetSelectedPoint = (point: Moment | null) => {
    if (
      point &&
      Array.isArray(point.coordinates) &&
      point.coordinates.length === 0
    ) {
      return;
    }
    setSelectedPoint(point);
  };
  //console.log("selected point: ", selectedPoint)
  return (
    <MapContext.Provider
      value={{ selectedPoint, setSelectedPoint: handleSetSelectedPoint }}
    >
      {children}
    </MapContext.Provider>
  );
};

export { MapContext, MapProvider };