 export interface Moment {
    id: string;
    albumId: string;
    description: string;
    image: string;
    coordinates: number[];
    commentCount: number;
    captureDate: string;
    createdBy: {
      id: string;
      avatar: string;
      username: string;
      name: string;
    };
  }
  
  export interface Album {
    id: string;
    title: string;
    moments: Moment[];
    sharedUsers: SharedUser[];
    createdBy: User | null;
    createdById: string;
    albumType: string;
  }

  export interface SharedUser {
    id: string;
    username: string;
    avatar: string;
    name: string;
  }

  export interface Comment {
    id: string;
    momentId: string;
    createdBy: {
        username: string;
        avatar: string;
        id: string;
    };
    commentText: string;
    replies: {
        author: {
          image: string;
        };
      }[];
    createdAt: string;
    isComment?: boolean;
  }

  interface Friend {
    id: string;
  }

  export interface User {
    id: string
    username: string;
    name: string;
    avatar: string;
    userType: string;
    totalDataUsed: number;
    friends: Friend[] | null;
}