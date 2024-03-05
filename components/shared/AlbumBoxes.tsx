import React from "react";
import AlbumBox from "@/components/shared/AlbumBox";
import { Album } from "@/models/models";

interface AlbumBoxesProps {
  aggregatedAlbum: Album;
  albums: Album[];
  selectedAlbum: string | null;
  openAlbum: string | null;
  setOpenAlbum: React.Dispatch<React.SetStateAction<string | null>>;
  activePhoto: { albumId: string | null; photoId: string | null };
  setActivePhoto: (albumId: string | null, photoId: string | null) => void;
  toggleExpandedValue: (expanded: boolean) => void;
  handleAlbumClick: (albumId: string) => void;
}

const AlbumBoxes: React.FC<AlbumBoxesProps> = ({
  aggregatedAlbum,
  albums,
  selectedAlbum,
  openAlbum,
  setOpenAlbum,
  activePhoto,
  setActivePhoto,
  toggleExpandedValue,
  handleAlbumClick,
}) => {
  const renderAllAlbumBox = () => {
    const isSelected = selectedAlbum === "All";
    return (
      <div
        key="All"
        className={`${
          isSelected ? "bg-tb-2" : "bg-tb-1"
        } cursor-pointer border-l border-r border-t border-b border-gray-1 p-2`}
      >
        <AlbumBox
          key="All"
          album={aggregatedAlbum}
          name="All"
          onAlbumClick={() => handleAlbumClick("All")}
          isSelected={isSelected}
          openAlbum={openAlbum}
          setOpenAlbum={setOpenAlbum}
          activePhoto={activePhoto}
          setActivePhoto={setActivePhoto}
          toggleExpandedValue={toggleExpandedValue}
          onAlbumUpdate={() => {}}
        />
      </div>
    );
  };

  const renderMappedAlbumBoxes = () => {
    return albums.map((album, index, array) => (
      <div
        key={album.id}
        className={`${
          selectedAlbum === album.id ? "bg-tb-2" : "bg-tb-1"
        } cursor-pointer flex justify-between items-center p-2 ${
          index === 0 || index === array.length - 1
            ? "border-l border-r border-b"
            : "border-l border-r border-b"
        } border-gray-1`}
      >
        <AlbumBox
          key={album.id}
          album={album}
          name={album.title}
          onAlbumClick={handleAlbumClick}
          isSelected={selectedAlbum === album.id}
          openAlbum={openAlbum}
          setOpenAlbum={setOpenAlbum}
          activePhoto={activePhoto}
          setActivePhoto={setActivePhoto}
          toggleExpandedValue={toggleExpandedValue}
          onAlbumUpdate={() => {}}
        />
      </div>
    ));
  };

  return (
    <>
      {renderAllAlbumBox()}
      {renderMappedAlbumBoxes()}
    </>
  );
};

export default AlbumBoxes;
