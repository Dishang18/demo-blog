import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCQzqbo21Zs-pyD9R9-6HLB18imgyhTBUI",
  authDomain: "blog-website-react-9778f.firebaseapp.com",
  projectId: "blog-website-react-9778f",
  storageBucket: "blog-website-react-9778f.firebasestorage.app",
  messagingSenderId: "446204488644",
  appId: "1:446204488644:web:c628ecd12df1745858d291"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//google authprovider

const provider = new GoogleAuthProvider();

const auth = getAuth();
export const authWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const token = await result.user.getIdToken(); // Get the Firebase ID token
        return { access_token: token, user: result.user };
    } catch (err) {
        console.error(err);
        throw new Error("Google authentication failed.");
    }
};
