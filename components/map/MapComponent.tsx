import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapContext } from "@/contexts/MapContext";
import PhotoPopup from "../shared/PhotoPopup";
import { Moment } from "@/models/models";
import {
  constructAvatarImageUrl,
  constructThumbImageUrl,
} from "@/utilities/helpers";
import { fetchPresignedAvatarUrl } from "@/utilities/apiUtils";

mapboxgl.accessToken = `${process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}`;

declare module "mapbox-gl" {
  export interface Map {
    setConfigProperty: (property: string, theme: string, value: string) => void;
  }
  export interface Marker {
    setRotationAlignment(
      alignment: "map" | "viewport" | "auto" | "horizon"
    ): this;
  }
}

interface MapComponentProps {
  moments: Moment[];
  onPointClick: (moment: Moment | null, active: boolean | null) => void;
  onTogglePause?: () => void;
  onPausedChanged: (isPaused: boolean) => void;
  onLineVisibilityChanged: (isLineVisible: boolean) => void;
}

interface GeoJson {
  type: "Feature";
  properties: {};
  geometry: {
    type: "LineString";
    coordinates: number[][];
  };
}

interface GeoJSONGeometry {
  type: "Point";
  coordinates: [number, number];
}

interface GeoJSONFeature {
  type: "Feature";
  properties: any;
  geometry: GeoJSONGeometry;
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

interface MapComponentHandle {
  togglePause: () => void;
  toggleLineVisibility: () => void;
  restartAnimation: () => void;
}

const MapComponent = forwardRef<MapComponentHandle, MapComponentProps>(
  (
    { moments, onPointClick, onPausedChanged, onLineVisibilityChanged },
    ref
  ) => {
    let progress = 0;
    const animationRef = useRef<number>();
    const lastTimestampRef = useRef<number>(0);
    const pausedProgressRef = useRef<number>(0);
    const mapRef = useRef<mapboxgl.Map>();
    const pauseTimeRef = useRef<number>(0);
    const startTimeRef = useRef<number>(0);
    const { selectedPoint, setSelectedPoint } = useContext(MapContext);
    const [openPoint, setOpenPoint] = useState<Moment | null>(null);
    const [isLineVisible, setIsLineVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(true);
    const currentPopupRef = useRef<mapboxgl.Popup | null>(null);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const [segmentCompleted, setSegmentCompleted] = useState<boolean>(false);
    const [isSourceLoaded, setIsSourceLoaded] = useState(false);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const momentsMapRef = useRef<Map<string, Moment[]>>(new Map());

    const addMarkersToMap = useCallback((moments: Moment[]) => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      const seenAlbumIds = new Set<string>();

      const uniqueMoments = moments.filter((moment) => {
        if (seenAlbumIds.has(moment.albumId)) {
          return false;
        } else {
          seenAlbumIds.add(moment.albumId);
          return true;
        }
      });
      //console.log("UNIQUE MOMENTS: ", uniqueMoments)
      uniqueMoments.forEach((moment) => {
        if (
          !moment.coordinates ||
          moment.coordinates.length !== 2 ||
          typeof moment.coordinates[0] !== "number" ||
          typeof moment.coordinates[1] !== "number"
        ) {
          return;
        }

        const el = document.createElement("div");
        el.className = "marker";

        const size = 90;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;

        const popup = new mapboxgl.Popup({ offset: 45 });
        popup.setHTML(`<h2>${moment.description}</h2>`);

        el.addEventListener("click", () => {
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: coordinates,
              essential: true,
              zoom: 10,
            });
          }
        });

        const img = document.createElement("img");
        img.src = constructAvatarImageUrl(moment.createdBy.avatar);
        img.alt = "Image description";
        img.style.width = "40px";
        img.style.height = "40px";
        img.style.borderRadius = "50%";
        img.style.objectFit = "cover";
        img.style.objectPosition = "center";
        img.style.position = "absolute";
        img.style.top = "20%";
        img.style.left = "50%";
        img.style.transform = "translate(-50%, -50%)";
        el.appendChild(img);

        const coordinates: [number, number] = [
          moment.coordinates[0],
          moment.coordinates[1],
        ];
        const marker = new mapboxgl.Marker(el)
          .setLngLat(coordinates)
          .setRotationAlignment("horizon")
          .setOffset([0, -size / 2]);
        if (mapRef.current) {
          marker.addTo(mapRef.current);
        }
        markersRef.current.push(marker);
      });
    }, []);

    useEffect(() => {
      if (mapRef.current) {
        addMarkersToMap(moments);
        mapRef.current.on("zoom", () => {
          if (!mapRef.current) return;

          const zoom = mapRef.current.getZoom();
          const zoomLevelToShowMarkers = 8;

          if (zoom > zoomLevelToShowMarkers) {
            markersRef.current.forEach((marker) => marker.remove());
          } else {
            markersRef.current.forEach((marker) => {
              if (mapRef.current) {
                marker.addTo(mapRef.current);
              }
            });
          }
        });
      }
    });

    useEffect(() => {
      if (mapRef.current) {
        mapRef.current.on("zoom", () => {
          if (!mapRef.current) return;

          const zoom = mapRef.current.getZoom();
          const zoomLevelToShowMarkers = 8;

          if (zoom > zoomLevelToShowMarkers) {
            markersRef.current.forEach((marker) => marker.remove());
          } else {
            markersRef.current.forEach((marker) => {
              if (mapRef.current) {
                marker.addTo(mapRef.current);
              }
            });
          }
        });
      }
    });

    useImperativeHandle(
      ref,
      () => ({
        togglePause() {
          togglePause();
        },
        toggleLineVisibility() {
          toggleLineVisibility();
        },
        restartAnimation() {
          restartAnimation();
        },
      }),
      [isPaused, isLineVisible]
    );

    useEffect(() => {
      onPausedChanged(isPaused);
      onLineVisibilityChanged(isLineVisible);
    }, [isPaused, isLineVisible]);

    const momentsjsonRef = useRef<GeoJson>({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [],
      },
    });

    const momentsRounded: Moment[] = moments.map((moment) => ({
      ...moment,
      coordinates: [
        Math.round(moment.coordinates[0] * 10000) / 10000,
        Math.round(moment.coordinates[1] * 10000) / 10000,
      ],
    }));

    const momentsJson = useRef<GeoJSONFeatureCollection>({
      type: "FeatureCollection",
      features: momentsRounded.map((moment) => ({
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [moment.coordinates[0], moment.coordinates[1]],
        },
      })),
    });

    async function loadImage(imageElement: any, imageKey: any) {
      try {
        const presignedUrl = await fetchPresignedAvatarUrl(imageKey);
        imageElement.src = presignedUrl;
      } catch (error) {
        console.error("Error fetching presigned URL:", error);
      }
    }

    useEffect(() => {
      const loadAndAddImages = async () => {
        for (const moment of moments) {
          const imageUrl = moment.createdBy.avatar;
          const imageId = `avatar-${moment.id}`;
          await new Promise<void>((resolve, reject) => {
            if (!mapRef.current) return;

            const image = new Image();
            image.crossOrigin = "Anonymous";

            image.onload = () => {
              const size = 50;

              const canvas = document.createElement("canvas");
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext("2d");

              if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
              }

              ctx.beginPath();
              ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
              ctx.closePath();
              ctx.clip();

              const scale = Math.max(
                canvas.width / image.width,
                canvas.height / image.height
              );
              const x = canvas.width / 2 - (image.width / 2) * scale;
              const y = canvas.height / 2 - (image.height / 2) * scale;
              ctx.drawImage(
                image,
                x,
                y,
                image.width * scale,
                image.height * scale
              );

              canvas.toBlob((blob) => {
                if (!blob) {
                  reject(new Error("Canvas to Blob conversion failed"));
                  return;
                }
                const url = URL.createObjectURL(blob);
                const flippedImage = new Image();
                flippedImage.onload = () => {
                  if (!mapRef.current) {
                    URL.revokeObjectURL(url);
                    return;
                  }

                  const imageId = `avatar-${moment.id}`;
                  if (!mapRef.current.hasImage(imageId)) {
                    mapRef.current.addImage(imageId, flippedImage);
                    //console.log(`Added image: ${imageId}`);
                  }

                  URL.revokeObjectURL(url);
                  resolve();
                };
                flippedImage.onerror = reject;
                flippedImage.src = url;
              });
            };
            image.onerror = reject;
            loadImage(image, imageUrl);
          });
        }
        if (!mapRef.current) return;

        const source = mapRef.current.getSource(
          "points"
        ) as mapboxgl.GeoJSONSource;
        if (source) {
          momentsJson.current.features = momentsRounded.map((moment) => ({
            type: "Feature",
            properties: {
              imageId: `avatar-${moment.id}`,
            },
            geometry: {
              type: "Point",
              coordinates: [moment.coordinates[0], moment.coordinates[1]],
            },
          }));

          source.setData(momentsJson.current);
          setIsSourceLoaded(true);
        }
      };

      const addUnclusteredPointsLayer = () => {
        if (!mapRef.current) return;

        if (mapRef.current.getLayer("unclustered-point")) {
          mapRef.current.removeLayer("unclustered-point");
        }
        mapRef.current.addLayer({
          id: "unclustered-point",
          type: "symbol",
          source: "points",
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": ["get", "imageId"],
            "icon-size": 0.5,
            "icon-allow-overlap": true,
          },
        });
      };

      if (mapRef.current) {
        loadAndAddImages().then(() => {
          addUnclusteredPointsLayer();
          setupClickListener();
        });
      }
    }, [moments, isSourceLoaded]);

    const setupClickListener = () => {
      if (mapRef.current) {
        mapRef.current.on("click", "unclustered-point", async (e) => {
          if (!e.features || e.features.length === 0) return;

          const feature = e.features[0];

          if (
            !feature.geometry ||
            feature.geometry.type !== "Point" ||
            !feature.geometry.coordinates
          ) {
            return;
          }

          const coordinates = feature.geometry.coordinates.slice();

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          const coordinatesKey = `${
            Math.round(coordinates[0] * 10000) / 10000
          }, ${Math.round(coordinates[1] * 10000) / 10000}`;

          const nearbyMoments = momentsMapRef.current.get(coordinatesKey);

          if (nearbyMoments && nearbyMoments.length > 0) {
            handlePointSelect(nearbyMoments, coordinates as [number, number]);
          }
        });
      }
    };

    useEffect(() => {
      if (!mapRef.current) {
        mapRef.current = new mapboxgl.Map({
          container: "map",
          style: "mapbox://styles/mapbox/standard",
          center: [moments[0].coordinates[0], moments[0].coordinates[1]],
          zoom: 1,
        });

        // mapRef.current.on('style.load', () => {
        //     if (mapRef.current) { // Check if mapRef.current is defined
        //         mapRef.current.setConfigProperty('basemap', 'lightPreset', 'night');
        //     }
        // });

        if (mapRef.current && mapRef.current.isStyleLoaded()) {
          mapRef.current.setTerrain(null);
        }

        mapRef.current.on("load", () => {
          if (mapRef.current) {
            momentsjsonRef.current.geometry.coordinates = [
              [moments[0].coordinates[0], moments[0].coordinates[1]],
            ];

            mapRef.current.addSource("points", {
              type: "geojson",
              data: momentsJson.current,
              cluster: true,
              clusterMaxZoom: 12,
              clusterRadius: 50,
            });

            mapRef.current.on("sourcedata", (e) => {
              if (!mapRef.current) return;
              if (
                e.sourceId === "points" &&
                mapRef.current.isSourceLoaded("points")
              ) {
                setIsSourceLoaded(true);
              }
            });

            mapRef.current.addSource("line", {
              type: "geojson",
              data: momentsjsonRef.current,
            });

            mapRef.current.addLayer({
              id: "line-animation",
              type: "line",
              source: "line",
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
              paint: {
                "line-color": "#ed6498",
                "line-width": 5,
                "line-opacity": 0.8,
              },
            });

            mapRef.current.addLayer({
              id: "clusters",
              type: "circle",
              source: "points",
              minzoom: 8,
              filter: ["has", "point_count"],
              paint: {
                "circle-color": [
                  "step",
                  ["get", "point_count"],
                  "#EA2CB3",
                  100,
                  "#f1f075",
                  750,
                  "#f28cb1",
                ],
                "circle-radius": [
                  "step",
                  ["get", "point_count"],
                  20,
                  100,
                  30,
                  750,
                  40,
                ],
              },
            });

            mapRef.current.addLayer({
              id: "cluster-count",
              type: "symbol",
              source: "points",
              minzoom: 8,
              filter: ["has", "point_count"],
              layout: {
                "text-field": ["get", "point_count_abbreviated"],
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": 14,
              },
              paint: {
                "text-color": "#ffffff",
              },
            });

            mapRef.current.on("click", "clusters", (e) => {
              if (!mapRef.current) return;
              const features = mapRef.current.queryRenderedFeatures(e.point, {
                layers: ["clusters"],
              });

              if (
                features.length === 0 ||
                !features[0] ||
                features[0].properties === null
              )
                return;
              const feature = features[0];

              const clusterId = features[0].properties.cluster_id;

              const source = mapRef.current.getSource(
                "points"
              ) as mapboxgl.GeoJSONSource;
              if (!source) return;

              source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err || !mapRef.current) return;
                if (feature.geometry.type !== "Point") return;
                mapRef.current.easeTo({
                  center: feature.geometry.coordinates as [number, number],
                  zoom: zoom,
                });
              });
            });

            mapRef.current.on("mouseenter", "clusters", () => {
              if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = "pointer";
              }
            });

            mapRef.current.on("mouseleave", "clusters", () => {
              if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = "";
              }
            });
          }
        });
      }
    }, []);

    let spinInterval: NodeJS.Timeout | undefined;
    let inactivityTimeout: NodeJS.Timeout | undefined;

    const startSpinningMap = () => {
      stopSpinningMap();
      resetInactivityTimer();
      setupStopSpinningListeners();
      const spinSpeed = 0.1;
      if (!mapRef.current) return;
      mapRef.current.setZoom(1);
      if (mapRef.current && mapRef.current.getZoom() <= 1) {
        let longitude = mapRef.current ? mapRef.current.getCenter().lng : 0;
        const spin = () => {
          if (!mapRef.current) return;
          longitude = (longitude + spinSpeed) % 360;
          if (longitude > 180) {
            longitude -= 360;
          } else if (longitude < -180) {
            longitude += 360;
          }

          mapRef.current.jumpTo({
            center: [longitude, mapRef.current.getCenter().lat],
          });
        };

        return setInterval(spin, 100) as NodeJS.Timeout;
      }
    };

    const stopSpinningMap = () => {
      if (spinInterval !== undefined) {
        clearInterval(spinInterval);
        spinInterval = undefined;
      }
    };

    const resetInactivityTimer = () => {
      if (inactivityTimeout !== undefined) {
        clearTimeout(inactivityTimeout);
      }

      inactivityTimeout = setTimeout(() => {
        spinInterval = startSpinningMap();
      }, 180000);
    };

    useEffect(() => {
      if (mapRef.current) {
        spinInterval = startSpinningMap();
        setupStopSpinningListeners();
      }
    }, [mapRef.current, moments]);

    const setupStopSpinningListeners = () => {
      if (mapRef.current) {
        const stopSpinning = () => {
          stopSpinningMap();
          resetInactivityTimer();
        };
        mapRef.current.on("dragstart", stopSpinning);
        mapRef.current.on("wheel", stopSpinning);
        mapRef.current.on("zoomstart", stopSpinning);
        mapRef.current.on("zoomend", stopSpinning);
        mapRef.current.on("rotatestart", stopSpinning);
        mapRef.current.on("click", stopSpinning);
      }
    };

    useEffect(() => {
      if (enlargedImage == null) {
        onPointClick(null, false);
      }
    }, [enlargedImage]);

    useEffect(() => {
      momentsMapRef.current.clear();

      moments.forEach((moment) => {
        const key = `${Math.round(moment.coordinates[0] * 10000) / 10000}, ${
          Math.round(moment.coordinates[1] * 10000) / 10000
        }`;
        if (!momentsMapRef.current.has(key)) {
          momentsMapRef.current.set(key, [moment]);
        } else {
          momentsMapRef.current.get(key)?.push(moment);
        }
      });
    }, [moments]);

    const handlePointSelect = async (
      nearbyMoments: Moment[] | undefined,
      coordinates: [number, number]
    ) => {
      //console.log("MOMENTS MAP: ", momentsMapRef)

      if (nearbyMoments && nearbyMoments.length > 0) {
        if (currentPopupRef.current) {
          currentPopupRef.current.remove();
          currentPopupRef.current = null;
        }

        let popupHtml = `
                <div class="popup-carousel bg-opacity-0 cursor-pointer">
                    <img id="popupImage" src="${constructThumbImageUrl(
                      nearbyMoments[0].image
                    )}" alt="Image" style="width:100px; height:auto; background-color:transparent;">
                    <div id="popupDescription" class="popup-description" style="width:100px; color:white; background-color:transparent">${
                      nearbyMoments[0].description
                    }</div>
                    ${
                      nearbyMoments.length > 1
                        ? '<button id="prevBtn">&#10094;</button><button id="nextBtn">&#10095;</button>'
                        : ""
                    }
                </div>
            `;

        if (!mapRef.current) return;

        const newPopup = new mapboxgl.Popup({
          className: "bg-dark",
          closeButton: false,
        })
          .setLngLat(coordinates as [number, number])
          .setHTML(popupHtml)
          .addTo(mapRef.current);

        let currentImageIndex = 0;

        const updateImage = (index: number) => {
          const popupImage = document.getElementById(
            "popupImage"
          ) as HTMLImageElement;
          if (popupImage) {
            popupImage.src = nearbyMoments[index].image;
            popupImage.alt = `Image ${index}`;
          }
        };

        setTimeout(() => {
          const prevBtn = document.getElementById("prevBtn");
          const nextBtn = document.getElementById("nextBtn");

          if (prevBtn && nextBtn) {
            prevBtn.addEventListener("click", () => {
              if (currentImageIndex > 0) {
                currentImageIndex--;
                updateImage(currentImageIndex);
              }
            });

            nextBtn.addEventListener("click", () => {
              if (currentImageIndex < nearbyMoments.length - 1) {
                currentImageIndex++;
                updateImage(currentImageIndex);
              }
            });
          }

          const popupImage = document.getElementById("popupImage");
          if (popupImage) {
            popupImage.addEventListener("click", () => {
              onPointClick(nearbyMoments[currentImageIndex], null);
              setEnlargedImage(nearbyMoments[currentImageIndex].image);
              setOpenPoint(nearbyMoments[currentImageIndex]);
            });
          }
        }, 10);

        currentPopupRef.current = newPopup;
      }
    };

    const animateLine = useCallback(
      (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        if (pauseTimeRef.current !== 0) {
          startTimeRef.current += timestamp - pauseTimeRef.current;
          pauseTimeRef.current = 0;
        }

        const totalElapsedTime = timestamp - startTimeRef.current;

        let accumulatedDuration = 0;
        let segmentCompleted = false;

        for (let i = 0; i < moments.length - 1; i++) {
          const startPoint = [
            Number(moments[i].coordinates[0]),
            Number(moments[i].coordinates[1]),
          ];
          const endPoint = [
            Number(moments[i + 1].coordinates[0]),
            Number(moments[i + 1].coordinates[1]),
          ];
          const midpoint = calculateMidpoint(
            startPoint as [number, number],
            endPoint as [number, number]
          );
          const distance = haversineDistance(
            startPoint as [number, number],
            endPoint as [number, number]
          );
          const segmentDuration = calculateSegmentDuration(distance);

          if (totalElapsedTime < accumulatedDuration + segmentDuration) {
            const segmentInternalProgress =
              (totalElapsedTime - accumulatedDuration) / segmentDuration;
            const currentLongitude =
              startPoint[0] +
              (endPoint[0] - startPoint[0]) * segmentInternalProgress;
            const currentLatitude =
              startPoint[1] +
              (endPoint[1] - startPoint[1]) * segmentInternalProgress;
            const currentDistanceToMid = haversineDistance(
              [currentLongitude, currentLatitude],
              midpoint
            );
            const maxDistanceToMid = distance / 2;
            const proximityToMid = 1 - currentDistanceToMid / maxDistanceToMid;

            var zoomLevel = maxZoomLevel;

            if (distance > 200) {
              //console.log("prox to mid: ", proximityToMid)
              zoomLevel =
                minZoomLevel +
                (maxZoomLevel - minZoomLevel) * (1 - proximityToMid);
            } else if (distance > 30) {
              //console.log("prox to mid: ", proximityToMid)
              zoomLevel = 9 + 3 * (1 - proximityToMid);
            }

            if (mapRef.current) {
              mapRef.current.setZoom(zoomLevel);

              mapRef.current.panTo([currentLongitude, currentLatitude], {
                duration: 250,
              });
              momentsjsonRef.current.geometry.coordinates.push([
                currentLongitude,
                currentLatitude,
              ]);

              const source = mapRef.current.getSource(
                "line"
              ) as mapboxgl.GeoJSONSource;
              if (source && source.setData) {
                source.setData(momentsjsonRef.current);
              }
            }
            setSegmentCompleted(false);
            break;
          }
          accumulatedDuration += segmentDuration;
          setSegmentCompleted(true);
        }

        if (!segmentCompleted) {
          lastTimestampRef.current = timestamp;
          animationRef.current = requestAnimationFrame(animateLine);
        }
      },
      [moments]
    );

    useEffect(() => {
      if (selectedPoint && mapRef.current) {
        const coordinatesKey = `${
          Math.round(selectedPoint.coordinates[0] * 10000) / 10000
        }, ${Math.round(selectedPoint.coordinates[1] * 10000) / 10000}`;

        const coordinates: [number, number] = [
          selectedPoint.coordinates[0],
          selectedPoint.coordinates[1],
        ];
        const nearbyMoments = momentsMapRef.current.get(coordinatesKey);
        handlePointSelect(nearbyMoments, coordinates);

        mapRef.current.flyTo({
          center: coordinates,
          essential: true,
          zoom: 14,
        });
      } else {
        handlePointSelect(undefined, [0, 0]);
      }
    }, [selectedPoint]);

    // clear points
    useEffect(() => {
      return () => {
        if (mapRef.current) {
          mapRef.current.off("click", (e) => {
            setSelectedPoint(null);
          });
        }
      };
    }, [setSelectedPoint]);

    // fly to album points
    useEffect(() => {
      //console.log("POINTS: ", points)
      if (mapRef.current) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          mapRef.current.stop();
        }

        momentsJson.current.features = momentsRounded.map((moment) => ({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [moment.coordinates[0], moment.coordinates[1]],
          },
        }));

        const pointsSource = mapRef.current.getSource(
          "points"
        ) as mapboxgl.GeoJSONSource;
        if (pointsSource) {
          pointsSource.setData(momentsJson.current);
        }

        const firstPoint = moments[0];
        mapRef.current.flyTo({
          center: [firstPoint.coordinates[0], firstPoint.coordinates[1]],
          essential: true,
          zoom: 9,
        });
      }
    }, [moments]);

    function haversineDistance(
      coords1: [number, number],
      coords2: [number, number]
    ) {
      const R = 6371;
      const dLat = ((coords2[1] - coords1[1]) * Math.PI) / 180;
      const dLon = ((coords2[0] - coords1[0]) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((coords1[1] * Math.PI) / 180) *
          Math.cos((coords2[1] * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    function calculateSpeedAdjustment(distance: number): number {
      const shortDistance = 5;
      const mediumDistance = 30;
      const longDistance = 100;

      const speedForShortDistance = 1;
      const speedForMediumDistance = 1.5;
      const speedForLongDistance = 2.5;

      if (distance <= shortDistance) {
        return speedForShortDistance;
      } else if (distance <= mediumDistance) {
        return speedForMediumDistance;
      } else if (distance <= longDistance) {
        return speedForLongDistance;
      } else {
        return 3;
      }
    }

    const baseDuration = 5000;
    const maxZoomLevel = 13;
    const minZoomLevel = 7;

    function calculateSegmentDuration(distance: number): number {
      return baseDuration * calculateSpeedAdjustment(distance);
    }

    function calculateMidpoint(
      point1: [number, number],
      point2: [number, number]
    ): [number, number] {
      const midLat = (point1[1] + point2[1]) / 2;
      const midLon = (point1[0] + point2[0]) / 2;
      return [midLon, midLat];
    }

    useEffect(() => {
      if (!isPaused) {
        if (!animationRef.current) {
          animationRef.current = requestAnimationFrame(animateLine);
          if (segmentCompleted) {
            restartAnimation();
          }
        }
      } else {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = undefined;
          pauseTimeRef.current = performance.now();
          pausedProgressRef.current = progress;
        }
      }
    }, [
      segmentCompleted,
      momentsjsonRef.current,
      moments,
      isPaused,
      animateLine,
    ]);

    const restartAnimation = useCallback(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      setIsPaused(false);
      setIsLineVisible(true);
      pausedProgressRef.current = 0;
      startTimeRef.current = 0;
      lastTimestampRef.current = 0;
      pauseTimeRef.current = 0;
      momentsjsonRef.current.geometry.coordinates = [
        [moments[0].coordinates[0], moments[0].coordinates[1]],
      ];
      animationRef.current = requestAnimationFrame(animateLine);
    }, [animateLine, moments]);

    const toggleLineVisibility = useCallback(() => {
      setIsLineVisible((prevIsLineVisible) => {
        const newVisibility = !prevIsLineVisible;

        if (mapRef.current) {
          mapRef.current.setLayoutProperty(
            "line-animation",
            "visibility",
            newVisibility ? "visible" : "none"
          );
        }
        if (!isPaused) {
          togglePause();
        }
        return newVisibility;
      });
    }, [isPaused]);

    const togglePause = useCallback(() => {
      setIsPaused((prevIsPaused) => {
        if (prevIsPaused && !isLineVisible) {
          setIsLineVisible(true);
          if (mapRef.current) {
            mapRef.current.setLayoutProperty(
              "line-animation",
              "visibility",
              "visible"
            );
          }
        }
        return !prevIsPaused;
      });
    }, [isLineVisible]);

    return (
      <div className="map-container relative w-full h-full">
        <div id="map" className="w-full h-full"></div>
        <PhotoPopup
          enlargedImage={enlargedImage}
          setEnlargedImage={setEnlargedImage}
          moment={openPoint}
          album={moments}
          onNewPhotoSelected={setOpenPoint}
          isCommentsOpen={false}
        />
      </div>
    );
  }
);

export default MapComponent;