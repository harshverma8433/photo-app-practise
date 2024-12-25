import React, { useEffect, useState } from "react";
import { list, remove, getUrl } from "aws-amplify/storage";
import {
  Download,
  Share2,
  Trash2,
  Loader2,
  Heart,
  Instagram,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import * as Amplify from "aws-amplify";
const { Auth } = Amplify;

interface Photo {
  key: string;
  url: string;
  likes: number;
  liked: boolean;
}

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      // Ensure the user is authenticated
      const user = await Auth.currentAuthenticatedUser();
      if (!user) {
        throw new Error("User is not authenticated");
      }

      // Proceed to fetch photos if the user is authenticated
      const result = await list("");
      const photoUrls = await Promise.all(
        result.items.map(async (photo) => ({
          key: photo.key,
          url: (await getUrl({ key: photo.key })).url.toString(),
          likes: Math.floor(Math.random() * 100), // Simulated likes count
          liked: false,
        }))
      );
      setPhotos(photoUrls);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast.error("Error loading photos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await remove({ key });
      setPhotos((prev) => prev.filter((photo) => photo.key !== key));
      toast.success("Photo deleted successfully");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Error deleting photo");
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Photo downloaded successfully");
    } catch (error) {
      console.error("Error downloading photo:", error);
      toast.error("Error downloading photo");
    }
  };

  const handleLike = (key: string) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.key === key
          ? {
              ...photo,
              likes: photo.liked ? photo.likes - 1 : photo.likes + 1,
              liked: !photo.liked,
            }
          : photo
      )
    );
  };

  const handleShare = async (
    photo: Photo,
    platform: "instagram" | "whatsapp"
  ) => {
    try {
      const shareText = "Check out this amazing photo!";
      const shareUrl = encodeURIComponent(photo.url);

      let url = "";
      if (platform === "instagram") {
        // Instagram sharing via stories
        url = `instagram://library?AssetPath=${shareUrl}`;
      } else if (platform === "whatsapp") {
        // WhatsApp sharing
        url = `https://wa.me/?text=${encodeURIComponent(
          shareText + " " + photo.url
        )}`;
      }

      window.open(url, "_blank");
      toast.success(`Shared on ${platform}`);
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Error sharing photo");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Photos</h2>
      {photos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No photos uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.key}
              className="bg-white rounded-xl shadow-lg overflow-hidden group"
            >
              <div className="relative">
                <img
                  src={photo.url}
                  alt={photo.key}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-4">
                  <button
                    onClick={() => handleDownload(photo.url, photo.key)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Download"
                  >
                    <Download size={20} className="text-gray-800" />
                  </button>
                  <button
                    onClick={() => handleDelete(photo.key)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={20} className="text-red-500" />
                  </button>
                  <button
                    onClick={() => handleShare(photo, "instagram")}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Share on Instagram"
                  >
                    <Instagram size={20} className="text-gray-800" />
                  </button>
                  <button
                    onClick={() => handleShare(photo, "whatsapp")}
                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle size={20} className="text-gray-800" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleLike(photo.key)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Heart
                      size={20}
                      className={photo.liked ? "fill-red-500 text-red-500" : ""}
                    />
                    <span>{photo.likes}</span>
                  </button>
                  <span className="text-sm text-gray-500">
                    {new Date(photo.key.split("/")[1]).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
