//importing tools
import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import InlineCode from "@editorjs/inline-code";


const uploadImageByFile = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject({ success: 0, message: "No file provided" });
            return;
        }

        const reader = new FileReader();
        
        reader.onload = () => {
            resolve({
                success: 1,
                file: { url: reader.result } // Base64 image URL
            });
        };

        reader.onerror = () => {
            reject({ success: 0, message: "Error reading file" });
        };

        reader.readAsDataURL(file); // Convert file to Base64
    });
};

// const uploadImageByFile = (e) => {
//     //used AWS uploadImage function
// }

const uploadImageByURL = async (url) => {
    try {
        if (!url) throw new Error("Invalid URL");

        return {
            success: 1,
            file: { url } // Returning the correct format
        };
    } catch (error) {
        console.error("Image upload failed:", error);
        return { success: 0, message: error.message };
    }
};


export const tools = {
    embed: Embed,
    list: {
        class: List,
        inlineToolbar: true
    },
    image: {
        class: Image,
        config: {
            uploader: {
                uploadByUrl: uploadImageByURL,
                uploadByFile: uploadImageByFile
            }
        }
    },
    header: {
        class: Header,
        config: {
            placeholder: "Name Your Heading",
            levels: [2, 3],
            defaultLevel: 2
        }
    },
    quote: {
        class: Quote,
        inlineToolbar: true
    },
    marker: Marker,
    inlineCode: InlineCode
}