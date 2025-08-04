import React, { useRef, useEffect } from "react";

const VideoPlayer = ({ stream, isMuted }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      style={{ width: 300, borderRadius: 8, margin: 10 }}
    />
  );
};

export default VideoPlayer;
