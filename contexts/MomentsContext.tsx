import { createContext, useContext } from "react";

interface AlbumsContextProps {
  fetchAlbumsData: () => void;
}

export const AlbumsContext = createContext<AlbumsContextProps>({
  fetchAlbumsData: () => {},
});

export const useAlbumsContext = () => useContext(AlbumsContext);
