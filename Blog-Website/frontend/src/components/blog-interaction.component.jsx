// import { useContext } from "react";
// import { BlogContext } from "../pages/blog.page";
// import { UserContext } from "../App";
// import { Link } from "react-router-dom";


// const BlogInteraction = () => {

//     let { blog: { title, blog_id, activity, activity: { total_likes, total_comments }, author: {
//         personal_info: { username: author_username }
//     } }, setBlog } = useContext(BlogContext);

//     let { userAuth: { username } } = useContext(UserContext);

//     return (
//         <>
//             <hr className="border-grey my-2" />
//             <div className="flex gap-6 justify-between">
//                 <div className="flex gap-3 items-center">

//                     <button className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
//                         <i className="fi fi-rr-heart"></i>
//                     </button>
//                     <p className="text-xl text-dark-grey ">{total_likes}</p>

//                     <button className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
//                         <i className="fi fi-rr-comment-dots"></i>
//                     </button>
//                     <p className="text-xl text-dark-grey ">{total_comments}</p>




//                 </div>

//                 <div className="flex gap-6 items-center">

//                     {
//                         username = author_username ?
//                             <Link to={`/editor/${blog_id}`} className="underline hover:text-purple ">Edit</Link> : ""
//                     }
//                     <Link to={`https://twitter.com/intent/tweet?text=Read ${title}&url=${location.href}`}><i className="fi fi-rr-brands-twitter text-xl hover:text-twitter "></i> </Link>
//                 </div>

//             </div>

//             <hr className="border-grey my-2" />
//         </>
//     )
// }

// export default BlogInteraction;




import { useContext, useEffect } from "react";
import { BlogContext } from "../pages/blog.page";
import { UserContext } from "../App";
import { Link } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";

const BlogInteraction = () => {
    let { blog, blog: { _id, title, blog_id, activity, activity: { total_likes, total_comments }, author: { personal_info: { username: author_username } } }, setBlog, islikedByUser, setLikedByUser, setCommentsWrapper  } = useContext(BlogContext);
    let { userAuth: { username, access_token } } = useContext(UserContext);


    useEffect(() => {

        if( access_token ) {
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/isliked-by-user", { _id }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            }).then(( { data: { result } }) => {
                setLikedByUser(Boolean(result))
                //console.log(result);
            }).catch((err) => {
                console.log(err)
            })
        }
    })

    // Handle Like Button Click
    const handleLike = () => {
        // setBlog(prev => ({
        //     ...prev,
        //     activity: { 
        //         ...prev.activity, 
        //         total_likes: total_likes + 1 // Increment like count
        //     }
        // }));

        if(access_token){
            //console.log('liked')
            setLikedByUser(preVal => !preVal);

            !islikedByUser ? total_likes++ : total_likes--;
            setBlog({ ...blog, activity: { ...activity, total_likes } })

            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/like-blog", { _id, islikedByUser }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            }).then(( { data }) => {
                //console.log(res)
            }).catch((err) => {
                console.log(err)
            })

        }else{
         toast.error("please login to like this blog")
        }

    };

    return (
        <>
        <Toaster />
            <hr className="border-grey my-2" />
            <div className="flex gap-6 justify-between">
                <div className="flex gap-3 items-center">
                    {/* Like Button */}
                    <button onClick={handleLike} className={"w-10 h-10 rounded-full flex items-center justify-center " + ( islikedByUser ? "bg-red/20 text-red " : "bg-grey/80")} >
                        <i className={"fi " + (islikedByUser ? "fi-sr-heart" : "fi-rr-heart")} ></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_likes}</p>

                    {/* Comment Button */}
                    <button onClick={() => setCommentsWrapper(preVal => !preVal)} className="w-10 h-10 rounded-full flex items-center justify-center bg-grey/80">
                        <i className="fi fi-rr-comment-dots"></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_comments}</p>
                </div>

                <div className="flex gap-6 items-center">
                    {/* Show "Edit" if the user is the author */}
                    {username === author_username && (
                        <Link to={`/editor/${blog_id}`} className="underline hover:text-purple">Edit</Link>
                    )}

                    {/* Twitter Share Link */}
                    <Link to={`https://twitter.com/intent/tweet?text=Read ${title}&url=${window.location.href}`}>
                        <i className="fi fi-brands-twitter text-xl hover:text-twitter"></i>
                    </Link>
                </div>
            </div>

            <hr className="border-grey my-2" />
        </>
    );
}

export default BlogInteraction;
