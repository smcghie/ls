"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import MapComponent from "@/components/map/MapComponent";
import { MapProvider } from "@/contexts/MapContext";
import Sheet, { SheetRef } from "react-modal-sheet";
import Image from "next/image";
import callApi from "@/utilities/api";
import { AlbumsContext } from "@/contexts/MomentsContext";
import ProfileHeader from "@/components/shared/ProfileHeader";
import AlbumBoxes from "@/components/shared/AlbumBoxes";
import ControlButtons from "@/components/shared/ControlButtons";
import { Album, Moment, User } from "@/models/models";

interface MapComponentHandle {
  togglePause: () => void;
  getIsPaused: () => boolean;
  toggleLineVisibility: () => void;
  getIsLineVisible: () => boolean;
  restartAnimation: () => void;
}

const MomentsClient = ({ params }: { params: { id: string } }) => {
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
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<User>();
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Personal");
  const [aggregatedAlbum, setAggregatedAlbum] = useState<Album>({
    id: "All",
    title: "All Moments",
    moments: [],
    createdBy: null,
    createdById: "All",
    sharedUsers: [],
    albumType: "Personal",
  });

  useEffect(() => {
    function checkScreenSize() {
      setIsSmallScreen(window.innerWidth < 768);
    }
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const snapPoints = [600, 400, 230, 35];

  const handleSnapChange = useCallback((index: number) => {
    const newBottomPosition = calculatePositionBasedOnSnapIndex(index);
    setMapButtonsBottom(newBottomPosition);
  }, []);

  function calculatePositionBasedOnSnapIndex(index: number): number {
    return 85 + snapPoints[index];
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await callApi(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/${params.id}`,
          { method: "GET" }
        );
        setUserData(res);
        //console.log("userres: ", res);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [params.id]);

  useEffect(() => {
    if (!isLoading) {
      fetchAlbumsData();
    }
  }, [params.id, userData, isLoading]);

  const fetchAlbumsData = async () => {
    if (userData) {
      try {
        const fetchedAlbums = await callApi(
          `${process.env.NEXT_PUBLIC_API_URL}/album/user/${params.id}`,
          { method: "GET" }
        );
        if ("message" in fetchedAlbums) {
          //console.log("RESPONSE MESSAGE: ", fetchedAlbums.message);
        } else {
          //console.log("RESPONSE: ", fetchedAlbums)
          setAccessGranted(true);
          setAlbums(fetchedAlbums);
        }
      } catch (error) {
        console.error("Error fetching albums data:", error);
        setAlbums([]);
      }
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

  // useEffect(() => {
  //   console.log("SCREEN SMALL: ", isSmallScreen);
  // }, [isSmallScreen]);

  useEffect(() => {
    if (isExpanded) {
      setShouldDisableDrag(true);
    } else if (!isExpanded) {
      setShouldDisableDrag(false);
    }
  }, [isExpanded]);

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

  const aggregateAllMoments = (): Album => {
    const allMoments = albums.reduce((allMoments: Moment[], album: Album) => {
      return [...allMoments, ...album.moments];
    }, []);

    return {
      ...aggregatedAlbum,
      moments: allMoments,
    };
  };

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

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const tabs = ["Personal", "Trip", "Shared"];

  interface TabProps {
    label: string;
    isActive: boolean;
    onClick: (label: string) => void;
  }

  const Tab: React.FC<TabProps> = ({ label, isActive, onClick }) => {
    return (
      <div
        className={`tab ${isActive ? "active" : ""}`}
        onClick={() => onClick(label)}
      >
        {label}
      </div>
    );
  };

  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => album.albumType === activeTab);
  }, [albums, activeTab]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative">
      {userData && (
        <div>
          <ProfileHeader
            avatar={userData.avatar}
            id={userData.id}
            name={userData.name}
            username={userData.username}
          />
        </div>
      )}

      <div className="text-light-1 md:mt-3 flex h-screen ">
        <div className="flex-1 flex">
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
              {!accessGranted && (
                <div className="flex justify-center items-center h-3/4 w-full">
                  <div className="text-center">
                    <Image
                      src="/assets/denied.png"
                      alt="Access denied"
                      width={150}
                      height={150}
                      className="mb-2"
                    />
                    <p className="text-light-1">User profile is private.</p>
                  </div>
                </div>
              )}

              {accessGranted && albums && albums.length === 0 && (
                <div className="flex justify-center items-center h-3/4 w-full">
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
                      <div className="tabs-container">
                        {tabs.map((tab) => (
                          <Tab
                            key={tab}
                            label={tab}
                            isActive={activeTab === tab}
                            onClick={setActiveTab}
                          />
                        ))}
                      </div>
                      {aggregatedAlbum &&
                        aggregatedAlbum.moments &&
                        aggregatedAlbum.moments.length > 0 && (
                          <AlbumBoxes
                            aggregatedAlbum={aggregatedAlbum}
                            albums={filteredAlbums}
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

export default MomentsClient;