export const getUserId = () => {
    const userId = localStorage.getItem("currentUser");
    if (userId) {
        return userId;
    } else {
        console.warn("No user ID found in local storage.");
        return null;
    }
};

interface Friend {
  id: string;
}
interface User {
  id: string;
  avatar: string;
  name: string;
  username: string;
  friends: Friend[];
  userType: string;
  albumCount: number;
  totalDataUsed: number;
};

export function getCurrentUserProfile(): User | null {
    const currentUserString = localStorage.getItem("currentUserProfile");
    if (currentUserString) {
      try {
        const userObject = JSON.parse(currentUserString);
        //console.log("USER OBJECT: ", userObject.user)
        return  userObject.user ;
      } catch (error) {
        console.error("Error parsing user profile:", error);
        return null;
      }
    }
    return null;
}
  