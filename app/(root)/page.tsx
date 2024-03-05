"use client";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import MapComponent from "@/components/map/MapComponent";
import { MapProvider } from "@/contexts/MapContext";
import Sheet, { SheetRef } from "react-modal-sheet";
import Image from "next/image";
import callApi from "@/utilities/api";
import { AlbumsContext } from "@/contexts/MomentsContext";
import HomeHeader from "@/components/shared/HomeHeader";
import AlbumBoxes from "@/components/shared/AlbumBoxes";
import ControlButtons from "@/components/shared/ControlButtons";
import { Album, Moment } from "@/models/models";

interface MapComponentHandle {
  togglePause: () => void;
  getIsPaused: () => boolean;
  toggleLineVisibility: () => void;
  getIsLineVisible: () => boolean;
  restartAnimation: () => void;
}

const Home = () => {
  const [modifiablePoints, setModifiablePoints] = useState<Moment[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isOverlayActive, setIsOverlayActive] = useState<boolean>(false);
  const ref = useRef<SheetRef>();
  const snapTo = (i: number) => ref.current?.snapTo(i);
  const [shouldDisableDrag, setShouldDisableDrag] = useState(false);
  const [mapButtonsBottom, setMapButtonsBottom] = useState<number>(10);
  const [isPaused, setIsPaused] = useState(true);
  const mapComponentRef = useRef<MapComponentHandle>(null);
  const [isLineVisible, setIsLineVisible] = useState(true);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [openAlbum, setOpenAlbum] = useState<string | null>(null);
  const [activePhoto, setActivePhotoState] = useState<{
    albumId: string | null;
    photoId: string | null;
  }>({ albumId: null, photoId: null });
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const snapPoints = [600, 400, 250, 40];
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [aggregatedAlbum, setAggregatedAlbum] = useState<Album>({
    id: "All",
    title: "All Moments",
    moments: [],
    createdById: "All",
    createdBy: null,
    albumType: "Personal",
    sharedUsers: [],
  });

  useEffect(() => {
    function checkScreenSize() {
      setIsSmallScreen(window.innerWidth < 768);
    }
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    fetchAlbumsData();
  }, []);

  const fetchAlbumsData = async (page = 1) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/activity?page=${page}&limit=10`;
      const response = await callApi(url, { method: "GET" });
      const { albums: fetchedAlbums, hasMore } = response;

      setAlbums((prevAlbums) => [...prevAlbums, ...fetchedAlbums]);
      //console.log("FETCHED ALBUMS: ", fetchedAlbums);
      setHasMore(hasMore);
    } catch (error) {
      console.error("Error fetching albums data:", error);
      setAlbums([]);
    }
  };

  useEffect(() => {
    console.log(`Current Page is now: ${currentPage}`);
  }, [currentPage]);

  const loadMoreAlbums = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchAlbumsData(nextPage);
  };

  useEffect(() => {
    if (isExpanded) {
      setShouldDisableDrag(true);
    } else if (!isExpanded) {
      setShouldDisableDrag(false);
    }
  }, [isExpanded]);

  useEffect(() => {
    const newAggregatedAlbum = aggregateAllMoments();
    setAggregatedAlbum(newAggregatedAlbum);
    setModifiablePoints(newAggregatedAlbum.moments);
  }, [albums]);

  const aggregateAllMoments = (): Album => {
    const allMoments = albums.reduce((allMoments: Moment[], album: Album) => {
      return [...allMoments, ...album.moments];
    }, []);

    return {
      ...aggregatedAlbum,
      moments: allMoments,
    };
  };

  const filterMoments = (moments: Moment[]) => {
    return moments.filter(
      (moment) =>
        moment.coordinates &&
        Array.isArray(moment.coordinates) &&
        moment.coordinates.length === 2 &&
        typeof moment.coordinates[0] === "number" &&
        typeof moment.coordinates[1] === "number"
    );
  };

  useEffect(() => {
    const newAggregatedAlbum = aggregateAllMoments();
    setAggregatedAlbum(newAggregatedAlbum);

    const filteredAggregatedMoments = filterMoments(newAggregatedAlbum.moments);
    setModifiablePoints(filteredAggregatedMoments);
  }, [albums]);

  const handleAlbumClick = (albumId: string) => {
    setSelectedAlbum(albumId);
    setActivePhoto(albumId, null);

    if (openAlbum !== albumId) {
      setOpenAlbum(albumId);
    } else {
      setOpenAlbum(null);
    }

    if (albumId === "All") {
      const filteredAggregatedMoments = filterMoments(aggregatedAlbum.moments);
      setModifiablePoints(filteredAggregatedMoments);
    } else {
      const clickedAlbum = albums.find((album) => album.id === albumId);

      if (clickedAlbum && clickedAlbum.moments) {
        const filteredClickedAlbumMoments = filterMoments(clickedAlbum.moments);
        setModifiablePoints(filteredClickedAlbumMoments);
      }
    }
  };

  const handleMapPointClick = (
    memoryData: Moment | null,
    active: boolean | null
  ) => {
    setIsOverlayActive(false);
    // if (memoryData != null) {
    //   setPointData(memoryData);
    // }
    if (active != null) {
      setIsOverlayActive(true);
    }
  };

  const handleTogglePause = () => {
    if (mapComponentRef.current) {
      mapComponentRef.current.togglePause();
    }
  };

  const handleToggleVisibility = () => {
    if (mapComponentRef.current) {
      mapComponentRef.current.toggleLineVisibility();
    }
  };

  const handlePausedChanged = (newIsPaused: boolean) => {
    setIsPaused(newIsPaused);
  };

  const handleLineVisibilityChanged = (newIsLineVisible: boolean) => {
    setIsLineVisible(newIsLineVisible);
  };

  const handleToggleRestartAnimation = () => {
    if (mapComponentRef.current) {
      mapComponentRef.current.restartAnimation();
    }
  };

  const setActivePhoto = (albumId: string | null, photoId: string | null) => {
    setActivePhotoState({ albumId, photoId });
  };

  const toggleExpandedValue = (expanded: boolean) => {
    if (isSmallScreen) {
      snapTo(0);
    }
    setIsExpanded(expanded);
  };

  const handleSnapChange = useCallback((index: number) => {
    const newBottomPosition = calculatePositionBasedOnSnapIndex(index);
    setMapButtonsBottom(newBottomPosition);
  }, []);

  function calculatePositionBasedOnSnapIndex(index: number): number {
    return 110 + snapPoints[index];
  }

  return (
    <div className="relative">
      <HomeHeader />

      <div className="text-light-1 md:mt-3 flex h-screen">
        <div className="flex-1 flex ">
          <AlbumsContext.Provider value={{ fetchAlbumsData }}>
            <MapProvider>
              <div className="relative flex-1 md:h-3/4 z-100">
                {modifiablePoints.length > 0 && (
                  <MapComponent
                    ref={mapComponentRef}
                    moments={modifiablePoints}
                    onPointClick={handleMapPointClick}
                    onPausedChanged={handlePausedChanged}
                    onLineVisibilityChanged={handleLineVisibilityChanged}
                  />
                )}

                {albums && albums.length > 0 && (
                  <div
                    className={`absolute left-1/2 md:bottom-10 transform -translate-x-1/2 z-20`}
                    style={
                      isSmallScreen ? { bottom: `${mapButtonsBottom}px` } : {}
                    }
                  >
                    <ControlButtons
                      isPaused={isPaused}
                      isLineVisible={isLineVisible}
                      handleToggleRestartAnimation={
                        handleToggleRestartAnimation
                      }
                      handleTogglePause={handleTogglePause}
                      handleToggleVisibility={handleToggleVisibility}
                    />
                  </div>
                )}
              </div>

              {albums && albums.length == 0 && (
                <div className="flex justify-center items-center w-full">
                  <div className="text-center">
                    <Image
                      src="/assets/folder.png"
                      alt="No albums"
                      width={150}
                      height={150}
                      className="mb-2"
                    />
                    <p className="text-light-1">User has no albums</p>
                  </div>
                </div>
              )}
              {!isSmallScreen && (
                <div className="md:flex md:flex-col md:flex-1 md:h-3/4 md:overflow-y-auto">
                  {albums && albums.length > 0 && (
                    <div className="max-md:hidden flex-1 overflow-y-auto ml-5">
                      {aggregatedAlbum &&
                        aggregatedAlbum.moments &&
                        aggregatedAlbum.moments.length > 0 && (
                          <AlbumBoxes
                            aggregatedAlbum={aggregatedAlbum}
                            albums={albums}
                            selectedAlbum={selectedAlbum}
                            openAlbum={openAlbum}
                            setOpenAlbum={setOpenAlbum}
                            activePhoto={activePhoto}
                            setActivePhoto={setActivePhoto}
                            toggleExpandedValue={toggleExpandedValue}
                            handleAlbumClick={handleAlbumClick}
                          />
                        )}
                      {hasMore && (
                        <div className="flex justify-center items-center bg-tb-2 border-l border-r border-b border-gray-1">
                          <button
                            onClick={loadMoreAlbums}
                            className="load-more-btn text-light-1"
                          >
                            Load More
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isSmallScreen && (
                <Sheet
                  ref={ref}
                  isOpen={true}
                  onClose={() => {
                    snapTo(3), console.log("CLOSED");
                  }}
                  style={{ display: isOverlayActive ? "block" : "none" }}
                  snapPoints={[600, 400, 250, 40]}
                  initialSnap={3}
                  onSnap={handleSnapChange}
                  disableDrag={shouldDisableDrag}
                >
                  <div className="hidden max-md:block">
                    <Sheet.Container>
                      <Sheet.Header />
                      <Sheet.Content style={{ paddingBottom: ref.current?.y }}>
                        <Sheet.Scroller draggableAt="both">
                          <div className="text-light-1 ">
                            {aggregatedAlbum &&
                              aggregatedAlbum.moments &&
                              aggregatedAlbum.moments.length > 0 && (
                                <AlbumBoxes
                                  aggregatedAlbum={aggregatedAlbum}
                                  albums={albums}
                                  selectedAlbum={selectedAlbum}
                                  openAlbum={openAlbum}
                                  setOpenAlbum={setOpenAlbum}
                                  activePhoto={activePhoto}
                                  setActivePhoto={setActivePhoto}
                                  toggleExpandedValue={toggleExpandedValue}
                                  handleAlbumClick={handleAlbumClick}
                                />
                              )}
                          </div>
                        </Sheet.Scroller>
                      </Sheet.Content>
                    </Sheet.Container>
                  </div>
                </Sheet>
              )}
            </MapProvider>
          </AlbumsContext.Provider>
        </div>
      </div>
    </div>
  );
};

export default Home;
