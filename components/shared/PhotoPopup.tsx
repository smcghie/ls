import React, { useContext, useEffect, useState } from "react";
import CommentCard from "../cards/CommentCard";
import AddCommentCard from "../cards/AddCommentCard";
import { fetchPresignedAvatarUrl } from "@/utilities/apiUtils";
import { MapContext } from "@/contexts/MapContext";
import { Moment, Comment } from "@/models/models";
import callApi from "@/utilities/api";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { v4 as uuidv4 } from "uuid";
import { constructFullImageUrl, constructThumbImageUrl } from "@/utilities/helpers";

interface PhotoPopupProps {
  enlargedImage: string | null;
  setEnlargedImage: (image: string | null) => void;
  moment: Moment | null;
  album: Moment[];
  onNewPhotoSelected: (point: Moment | null) => void;
  isCommentsOpen: boolean;
}

const PhotoPopup: React.FC<PhotoPopupProps> = ({
  enlargedImage,
  setEnlargedImage,
  moment,
  album,
  onNewPhotoSelected,
  isCommentsOpen,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isOpen, setOpen] = useState(false);
  const { setSelectedPoint } = useContext(MapContext);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [startReport, setStartReport] = useState(false);

  useEffect(() => {
    if (isOpen && moment && moment.commentCount > 0) {
      fetchComments();
    }
  }, [isOpen, moment]);

  useEffect(() => {
    if (isCommentsOpen) {
      setOpen(true);
    }
  }, [isCommentsOpen]);

  // useEffect(() => {
  //   console.log("REPROT: ", startReport);
  // }, [startReport]);

  const handleCommentAdded = async (newComment: Comment) => {
    const commentWithUUID = { ...newComment, id: uuidv4() };
    setComments((prevComments) => [...prevComments, commentWithUUID]);
    if (moment) {
      moment.commentCount += 1;
    }
  };

  const fileReport = async () => {
    if (moment) {
      const reportData = {
        reportedUserId: moment.createdBy.id,
        reportedMomentId: moment.id,
        status: "pending"
      };

      try {
        const res = await callApi(
          `${process.env.NEXT_PUBLIC_API_URL}/reports`,
          {
            method: "POST",
            body: reportData,
          }
        );

        if (res) {
          setStartReport(false);
        } else {
          console.error("Failed to file report");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const handleCommentDeleted = async () => {
    if (isOpen && moment) {
      moment.commentCount -= 1;
      await fetchComments();
    }
  };

  async function fetchComments() {
    if (!moment || (moment && moment.commentCount === 0)) {
      setComments([]);
      return;
    }

    try {
      const res = await callApi(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${moment.id}`,
        {
          method: "GET",
        }
      );
      if (res) {
        setComments(res);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    }
  }

  useEffect(() => {
    function checkScreenSize() {
      setIsSmallScreen(window.innerWidth < 768);
    }
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!enlargedImage) return null;

  return (
    <div className="overlay z-100 " onClick={() => setEnlargedImage(null)}>
      <div className="flex items-center overflow-hidden h-full mb-4">
        <div
          className={`transition-all duration-300 ${
            isOpen
              ? "w-3/4 h-full max-md:w-full max-md:h-full mt-10"
              : "w-full h-full"
          } `}
        >
          {!isSmallScreen && (
            <img
              src={constructFullImageUrl(enlargedImage)}
              onClick={(e) => e.stopPropagation()}
              className="max-w-full max-h-full object-contain mx-auto"
              alt="Large view"
            />
          )}

          {isSmallScreen && (
            <TransformWrapper
              onZoomStop={(e) => console.log("Zoom action stopped")}
              onPanningStop={(e) => console.log("Panning action stopped")}
            >
              {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                <>
                  <TransformComponent>
                    <div
                      className="w-full h-full"
                      onClick={(e) => {
                        resetTransform();
                        e.stopPropagation();
                      }}
                    >
                      <img
                        src={constructFullImageUrl(enlargedImage)}
                        alt="Zoomable"
                        className="max-w-full max-h-full object-contain mx-auto"
                      />
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          )}
        </div>
        {!isOpen && (
          <button
            className="absolute top-0 right-0 m-4 w-8 h-8 pb-0.5 bg-black bg-opacity-40 text-white rounded-full text-heading2-bold flex items-center justify-center text-opacity-75 z-50"
            onClick={(e) => {
              e.stopPropagation();
              setEnlargedImage(null);
            }}
            aria-label="Close image"
          >
            &times;
          </button>
        )}
        <div
          className={`transition-transform duration-300 transform ${
            isOpen
              ? "translate-x-0 translate-x-0 w-1/2"
              : "max-md:translate-y-full max-md:translate-x-full w-0"
          } 
                flex flex-col overflow-hidden h-3/4 max-md:h-full max-md:absolute max-md:top-0 max-md:right-0 max-md:w-full max-md:z-20 max-md:overflow-y-auto ml-4`}
        >
          <button
            className="self-end pr-4"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!isOpen);
            }}
            style={{ fontSize: "24px" }}
          >
            <p className="">&times;</p>
          </button>

          {moment && (
            <div className="flex-grow overflow-y-auto max-md:max-h-[calc(100%-26rem)] max-h-[calc(100%-10rem)] max-md:ml-6">
              {comments?.map((comment, index) => (
                <div
                  key={comment.id}
                  className={`${
                    index === 0
                      ? "rounded-t-xl pt-4"
                      : index === comments.length - 1
                      ? "rounded-b-xl pb-4"
                      : ""
                  } bg-tb-3 bg-opacity-75 pl-4 mr-6`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CommentCard
                    id={comment.id}
                    createdBy={comment.createdBy}
                    albumId={moment.albumId}
                    commentText={comment.commentText}
                    replies={comment.replies}
                    createdAt={comment.createdAt}
                    isComment={true}
                    onCommentDeleted={handleCommentDeleted}
                  />
                </div>
              ))}
            </div>
          )}

          <div
            className="pt-4 max-md:ml-6"
            onClick={(e) => e.stopPropagation()}
          >
            <AddCommentCard
              momentId={moment?.id ?? ""}
              onCommentAdded={handleCommentAdded}
            />
          </div>
        </div>
      </div>

      <div className="relative w-full mt-4">
        {!isOpen && (
        <div
          className="flex flex-row absolute left-0 z-35 transform translate-y-full origin-bottom-left px-2 pt-1 bg-dark-2 bg-opacity-80 text-white rounded-br-lg rounded-tr-lg"
          onClick={(e) => e.stopPropagation()}
          style={{top: '-7rem'}}
        >
          <button
            onClick={() => setStartReport(true)}
            className=" "
          >
            <img
              src="/assets/report.png"
              alt="Report"
              className="w-6 h-6 object-contain mx-auto mt-1 mb-2 opacity-80 hover:opacity-100"
            />
          </button>
          {startReport && (
              <div className="flex items-center text-gray-1 text-light-1 pl-2">
                <p className="mr-2">Report for illicit content?</p>
                <button
                  onClick={() => fileReport()}
                  className="hover:text-gray-500"
                >
                  Yes
                </button>
                <p className="mx-2">/</p>
                <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStartReport(false);
                    }}
                  className="hover:text-gray-500"
                >
                  No
                </button>
              </div>
            )}
        </div>
        )}

        <div
          className="absolute right-0 -top-7 z-30 mr-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setOpen(!isOpen)}
            className="px-2 pt-1 bg-tb-3 bg-opacity-80 text-white rounded-tl-lg rounded-tr-lg hover:text-gray-3"
          >
            <p>{moment?.commentCount}&nbsp;comments</p>
          </button>
        </div>

        <div
          className="flex overflow-x-auto p-2.5 w-full bg-tb-3 bg-opacity-80 mt-0 max-h-[150px]"
          onClick={(e) => e.stopPropagation()}
        >
          {album.map((image) => (
            <img
              key={image.id}
              src={constructThumbImageUrl(image.image)}
              className="mr-2.5 max-w-[95px]"
              onClick={(e) => {
                e.stopPropagation();
                setEnlargedImage(image.image);
                setSelectedPoint(image);
                onNewPhotoSelected(image);
              }}
              alt="Carousel thumbnail"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoPopup;