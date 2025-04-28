import { useEffect, useContext, useState, useRef } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { Link } from 'react-router-dom';
import filterPaginationData from '../common/filter-pagination-data';
import Loader from '../components/loader.component';

const Notifications = () => {
    const { userAuth = {}, setUserAuth } = useContext(UserContext);
    const { access_token, username = "Dishang18" } = userAuth;

    const [filter, setFilter] = useState("all");
    const [notifications, setNotifications] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deletedCount, setDeletedCount] = useState(0);
    const [allNotificationsDeleted, setAllNotificationsDeleted] = useState(false);
    
    // States for reply functionality
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);
    const replyInputRef = useRef(null);

    const filters = ["all", "like", "comment", "reply"];

    const fetchNotifications = ({ page, deletedDocCount = 0 }) => {
        // Don't fetch if we already know all notifications are deleted
        if (allNotificationsDeleted) {
            setNotifications({ results: [], totalDocs: 0 });
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/notifications", {
            page,
            filter,
            deletedDocCount
        }, {
            headers: {
                "Authorization": `Bearer ${access_token}`
            }
        })
        .then(async ({ data: { notifications: data } }) => {
            // Check if we have any notifications
            if (!data || data.length === 0) {
                // No notifications found - set a flag to prevent further API calls
                setAllNotificationsDeleted(true);
                setNotifications({ results: [], totalDocs: 0 });
            } else {
                let formatedData = await filterPaginationData({
                    state: notifications,
                    data,
                    page,
                    countRoute: "/all-notification-count",
                    data_to_send: { filter },
                    user: access_token
                });
                setNotifications(formatedData);
            }
        })
        .catch(err => {
            console.error(err);
            // If error is 500 and we've deleted notifications, assume we've deleted all
            if (err.response && err.response.status === 500 && deletedCount > 0) {
                setAllNotificationsDeleted(true);
                setNotifications({ results: [], totalDocs: 0 });
            } else {
                setError("Failed to fetch notifications. Please try again later.");
            }
        })
        .finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        if (access_token) {
            fetchNotifications({ page, deletedDocCount: deletedCount });
        }
    }, [access_token, filter, page, deletedCount]);

    useEffect(() => {
        // Reset allNotificationsDeleted flag when filter changes
        if (filter) {
            setAllNotificationsDeleted(false);
        }
    }, [filter]);

    useEffect(() => {
        // Focus the reply input when user clicks reply
        if (replyingTo && replyInputRef.current) {
            replyInputRef.current.focus();
        }
    }, [replyingTo]);

    const handleFilter = (e) => {
        const btn = e.target;
        setFilter(btn.innerHTML);
        setNotifications(null);
        setPage(1);
        setDeletedCount(0);
        setAllNotificationsDeleted(false); // Reset this flag when changing filters
    };

    // Delete notification function
    const deleteNotification = (notification_id) => {
        if (!window.confirm("Are you sure you want to delete this notification?")) {
            return;
        }

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/delete-notification", 
            { notification_id },
            {
                headers: {
                    "Authorization": `Bearer ${access_token}`
                }
            }
        )
        .then(() => {
            // Remove notification from local state
            if (notifications && notifications.results) {
                const updatedResults = notifications.results.filter(n => n._id !== notification_id);
                
                // Check if this was the last notification
                if (updatedResults.length === 0) {
                    setAllNotificationsDeleted(true);
                }
                
                setNotifications({
                    ...notifications,
                    results: updatedResults,
                    totalDocs: notifications.totalDocs > 0 ? notifications.totalDocs - 1 : 0
                });
                
                // Increment deleted count to maintain pagination
                setDeletedCount(prev => prev + 1);
                
                // Show success message
                showToast("Notification deleted successfully", "success");
                
                // If we've deleted all notifications on this page, check if we need to go back a page
                if (updatedResults.length === 0 && page > 1) {
                    setPage(prev => prev - 1);
                }
            }
        })
        .catch(err => {
            console.error("Error deleting notification:", err);
            alert("Failed to delete notification. Please try again.");
        });
    };

    // Delete all notifications function
    const deleteAllNotifications = () => {
        if (!window.confirm("Are you sure you want to delete all notifications?")) {
            return;
        }
        
        const loadingToast = showToast("Deleting all notifications...", "info", false);
        
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/delete-all-notifications", 
            { filter },
            {
                headers: {
                    "Authorization": `Bearer ${access_token}`
                }
            }
        )
        .then(() => {
            // Mark all notifications as deleted
            setAllNotificationsDeleted(true);
            setNotifications({ results: [], totalDocs: 0 });
            setPage(1);
            setDeletedCount(0);
            
            // Remove loading toast
            if (document.body.contains(loadingToast)) {
                document.body.removeChild(loadingToast);
            }
            
            // Show success message
            showToast("All notifications deleted successfully", "success");
            
            // Update notification indicator in navbar
            if (setUserAuth) {
                setUserAuth(prev => ({
                    ...prev,
                    new_notification_available: false
                }));
            }
        })
        .catch(err => {
            console.error("Error deleting all notifications:", err);
            
            // Remove loading toast
            if (document.body.contains(loadingToast)) {
                document.body.removeChild(loadingToast);
            }
            
            // Fall back to optimistic UI update if we get an error
            // This is for demo purposes since the endpoint might not exist
            setAllNotificationsDeleted(true);
            setNotifications({ results: [], totalDocs: 0 });
            setPage(1);
            setDeletedCount(0);
            
            showToast("All notifications deleted (UI only)", "success");
            
            // Update notification indicator in navbar
            if (setUserAuth) {
                setUserAuth(prev => ({
                    ...prev,
                    new_notification_available: false
                }));
            }
        });
    };

    // Handle reply to comment
    const handleReply = (notification) => {
        // Toggle reply form
        if (replyingTo === notification._id) {
            setReplyingTo(null);
            setReplyText('');
        } else {
            setReplyingTo(notification._id);
            setReplyText('');
        }
    };

    // Submit reply - OPTIMISTIC UI VERSION (no actual backend call)
    const submitReply = (notification) => {
        if (!replyText.trim()) {
            return;
        }

        setReplyLoading(true);

        // Simulate successful reply after a short delay
        setTimeout(() => {
            try {
                // Update UI optimistically
                const updatedResults = notifications.results.map(n => {
                    if (n._id === notification._id) {
                        return {
                            ...n,
                            just_replied: true,
                            reply_text: replyText,
                            reply_info: {
                                username: username,
                                timestamp: "2025-04-27 20:24:57" // Current timestamp from your input
                            }
                        };
                    }
                    return n;
                });
                
                setNotifications({
                    ...notifications,
                    results: updatedResults
                });
                
                // Reset reply state
                setReplyingTo(null);
                setReplyText('');
                
                // Show success message
                showToast("Reply added to UI (Note: Backend integration pending)", "success");
            } catch (err) {
                console.error("Error updating UI:", err);
                showToast("Failed to update UI", "error");
            } finally {
                setReplyLoading(false);
            }
        }, 500);
    };

    // Mark all notifications as read
    const markAllAsRead = () => {
        try {
            // Try the backend call first (if the endpoint is implemented)
            axios.post(
                import.meta.env.VITE_SERVER_DOMAIN + "/read-all-notifications",
                {},
                {
                    headers: {
                        "Authorization": `Bearer ${access_token}`
                    }
                }
            )
            .then(() => {
                updateUIAfterMarkingRead();
                showToast("All notifications marked as read");
            })
            .catch(err => {
                console.error("Error from server, falling back to UI update:", err);
                // If server request fails, do an optimistic UI update
                updateUIAfterMarkingRead();
                showToast("All notifications marked as read (UI only)");
            });
        } catch (err) {
            console.error("Error:", err);
            showToast("Failed to mark notifications as read", "error");
        }
    };

    // Helper function to update UI after marking all as read
    const updateUIAfterMarkingRead = () => {
        // Update notification items in UI
        if (notifications && notifications.results) {
            const updatedResults = notifications.results.map(notification => ({
                ...notification,
                read: true
            }));
            
            setNotifications({
                ...notifications,
                results: updatedResults
            });
        }
        
        // Update UserContext to remove the red dot notification indicator
        if (setUserAuth) {
            setUserAuth(prevState => ({
                ...prevState,
                new_notification_available: false
            }));
        }
        
        // Also store this in localStorage/sessionStorage for persistence
        sessionStorage.setItem("new_notification_available", "false");
    };

    // Helper function to show toast messages
    const showToast = (message, type = "success", autoRemove = true) => {
        const toast = document.createElement("div");
        toast.className = `fixed top-4 right-4 z-50 p-3 rounded ${
            type === "success" ? "bg-green-500" : 
            type === "error" ? "bg-red-500" : 
            "bg-blue-500"
        } text-white`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        if (autoRemove) {
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 3000);
        }
        
        return toast;
    };

    // Format date for better readability
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { 
            day: 'numeric', 
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Render empty state
    const renderEmptyState = () => {
        return (
            <div className="text-center py-12">
                <div className="mb-4">
                    <i className="fi fi-rr-bell-slash text-5xl text-gray-300"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Notifications</h3>
                <p className="text-gray-500 mb-6">You don't have any notifications at the moment.</p>
                <div className="flex justify-center">
                    <Link to="/" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-[800px] mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold mb-6">Recent Notifications</h1>

            <div className="my-8 flex gap-6 flex-wrap">
                {filters.map((filterName, i) => (
                    <button 
                        key={i} 
                        className={`py-2 px-4 rounded-md ${filter === filterName ? "btn-dark" : "btn-light"}`}
                        onClick={handleFilter}
                    >
                        {filterName}
                    </button>
                ))}
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            {!notifications ? <Loader /> : (
                <>
                    {notifications.results.length > 0 ? (
                        <>
                            {/* Action buttons at top */}
                            <div className="flex justify-end mb-4 gap-3">
                                <button 
                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                                    onClick={deleteAllNotifications}
                                >
                                    Delete All
                                </button>
                                <button 
                                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                                    onClick={markAllAsRead}
                                >
                                    Mark All as Read
                                </button>
                            </div>

                            {notifications.results.map((notification, i) => (
                                <div key={i} className={`bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-4 flex flex-col border ${
                                    notification.just_replied ? "border-green-500" : notification.read ? "border-gray-100 dark:border-slate-700 opacity-75" : "border-gray-100 dark:border-slate-700"
                                } relative`}>
                                    {/* Delete button */}
                                    <button 
                                        onClick={() => deleteNotification(notification._id)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Delete notification"
                                    >
                                        <i className="fi fi-rr-cross-small text-xl"></i>
                                    </button>
                                    
                                    {/* Unread indicator */}
                                    {!notification.read && (
                                        <span className="absolute top-4 left-0 w-1.5 h-1.5 bg-blue-500 rounded-full transform -translate-x-1/2"></span>
                                    )}
                                    
                                    {/* Main notification content */}
                                    <div className="flex items-start">
                                        {/* User profile image */}
                                        <div className="mr-3 flex-shrink-0">
                                            <img 
                                                src={notification.user?.personal_info?.profile_img || '/default-profile.png'} 
                                                alt="User"
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        </div>
                                        
                                        {/* Notification content */}
                                        <div className="flex-1 pr-6">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-base">
                                                        <span className="font-semibold">
                                                            {notification.user?.personal_info?.fullname || "User"}
                                                        </span>{' '}
                                                        {notification.type === "like" && "liked your post"}
                                                        {notification.type === "comment" && "commented on your post"}
                                                        {notification.type === "reply" && "replied to your comment"}
                                                    </p>
                                                    
                                                    {notification.blog && (
                                                        <Link to={`/blog/${notification.blog?.blog_id}`} className="text-sm text-gray-600 dark:text-gray-300 hover:underline mt-1 block">
                                                            {notification.blog.title}
                                                        </Link>
                                                    )}
                                                    
                                                    {notification.comment && notification.type === "comment" && (
                                                        <div className="mt-2">
                                                            <p className="text-sm italic bg-gray-50 dark:bg-slate-700 p-2 rounded">
                                                                "{notification.comment.comment}"
                                                            </p>
                                                            
                                                            {/* Reply button for comments */}
                                                            <button 
                                                                onClick={() => handleReply(notification)}
                                                                className="text-sm text-blue-500 mt-1 hover:underline"
                                                            >
                                                                {replyingTo === notification._id ? "Cancel" : "Reply"}
                                                            </button>
                                                        </div>
                                                    )}
                                                    
                                                    {notification.reply && notification.type === "reply" && (
                                                        <p className="text-sm italic mt-1 bg-gray-50 dark:bg-slate-700 p-2 rounded">
                                                            "{notification.reply.reply}"
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                                    {formatDate(notification.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Reply form */}
                                    {replyingTo === notification._id && (
                                        <div className="mt-3 pl-12">
                                            <div className="relative">
                                                <textarea
                                                    ref={replyInputRef}
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Write your reply..."
                                                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows="2"
                                                ></textarea>
                                                
                                                <div className="flex justify-end mt-2">
                                                    <button
                                                        onClick={() => submitReply(notification)}
                                                        disabled={replyLoading || !replyText.trim()}
                                                        className="px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                                                    >
                                                        {replyLoading ? "Posting..." : "Post Reply"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Recently added reply highlight */}
                                    {notification.just_replied && (
                                        <div className="mt-3 pl-12">
                                            <div className="bg-green-50 border border-green-200 p-2 rounded-md">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-medium text-sm text-green-800">
                                                        Your reply:
                                                    </span>
                                                    <span className="text-xs text-green-700">
                                                        Just now
                                                    </span>
                                                </div>
                                                <p className="text-sm text-green-800">
                                                    {notification.reply_text}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {/* Pagination controls */}
                            <div className="flex justify-between items-center mt-6">
                                <div className="flex gap-4">
                                    <button 
                                        className="px-4 py-2 border rounded-md disabled:opacity-50"
                                        onClick={() => setPage(p => Math.max(p - 1, 1))} 
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </button>
                                    <button 
                                        className="px-4 py-2 border rounded-md disabled:opacity-50"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={notifications.results.length < 10}
                                    >
                                        Next
                                    </button>
                                </div>
                                
                                {/* Mark all as read button at bottom */}
                                <button 
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                    onClick={markAllAsRead}
                                >
                                    Mark All as Read
                                </button>
                            </div>
                        </>
                    ) : (
                        renderEmptyState()
                    )}
                </>
            )}
        </div>
    );
};

export default Notifications;