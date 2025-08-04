import React, { useEffect, useState, useRef } from "react";
import Peer from "peerjs";
import VideoPlayer from "./VideoPlayer";
import {
  FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash,
  FaDesktop, FaStop, FaPhoneAlt, FaUserCircle, FaSignOutAlt, FaCopy
} from "react-icons/fa";
import copy from "copy-to-clipboard";

const Room = ({ username, onLogout }) => {
  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [peerIdToCall, setPeerIdToCall] = useState("");
  const [myPeerId, setMyPeerId] = useState("");
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerRef = useRef(null);
  const currentCallRefs = useRef([]);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMyStream(stream);
        peerRef.current = new Peer(undefined, {
          host: process.env.REACT_APP_PEER_SERVER_HOST || 'localhost',
          port: Number(process.env.REACT_APP_PEER_SERVER_PORT) || 9000,
          path: process.env.REACT_APP_PEER_SERVER_PATH || '/peerjs',
        });
        peerRef.current.on("open", id => setMyPeerId(id));
        peerRef.current.on("call", call => {
          call.answer(stream);
          currentCallRefs.current.push(call);
          call.on("stream", remoteStream => {
            setRemoteStreams(prev => prev.some(s => s.id === remoteStream.id) ? prev : [...prev, remoteStream]);
          });
          call.on("close", () => setRemoteStreams(prev => prev.filter(s => s.id !== call.remoteStream?.id)));
        });
        peerRef.current.on("error", err => console.error(err));
      } catch (err) {
        alert("Could not access camera or microphone. Please check permissions.");
      }
    };
    init();
    return () => {
      currentCallRefs.current.forEach(call => call.close());
      setRemoteStreams([]);
      myStream?.getTracks().forEach(track => track.stop());
      screenStreamRef.current?.getTracks().forEach(track => track.stop());
      peerRef.current?.destroy();
      peerRef.current = null;
    };
    // eslint-disable-next-line
  }, []);

  // --- Button Handlers ---
  const toggleMute = () => {
    if (!myStream) return;
    myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
    setMuted(!muted);
  };

  const toggleVideo = () => {
    if (!myStream) return;
    myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
    setVideoOff(!videoOff);
  };

  const startScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      currentCallRefs.current.forEach(call => {
        const sender = call.peerConnection.getSenders().find(s => s.track.kind === "video");
        if (sender) sender.replaceTrack(screenStream.getVideoTracks()[0]);
      });
      setMyStream(prevStream => {
        prevStream.getVideoTracks().forEach(track => (track.enabled = false));
        const combinedStream = new MediaStream([
          ...prevStream.getAudioTracks(),
          ...screenStream.getVideoTracks(),
        ]);
        return combinedStream;
      });
      screenStream.getVideoTracks()[0].addEventListener("ended", () => {
        stopScreenShare();
      });
    } catch (error) {
      console.error("Screen sharing failed:", error);
      alert("Screen sharing was cancelled or failed.");
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      currentCallRefs.current.forEach(call => {
        const videoSender = call.peerConnection.getSenders().find(s => s.track.kind === "video");
        if (videoSender) videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
        const audioSender = call.peerConnection.getSenders().find(s => s.track.kind === "audio");
        if (audioSender) audioSender.replaceTrack(cameraStream.getAudioTracks()[0]);
      });
      setMyStream(cameraStream);
      setMuted(false);
      setVideoOff(false);
    } catch (err) {
      console.error("Failed to revert to camera:", err);
      alert("Could not access camera/audio to stop screen sharing.");
    }
  };

  const callPeer = () => {
    if (!peerIdToCall || !myStream || !peerRef.current) return;
    const call = peerRef.current.call(peerIdToCall, myStream);
    currentCallRefs.current.push(call);
    call.on("stream", (remoteStream) => {
      setRemoteStreams((prev) => prev.some((s) => s.id === remoteStream.id) ? prev : [...prev, remoteStream]);
    });
    call.on("close", () => {
      setRemoteStreams(prev => prev.filter(s => s.id !== call.remoteStream?.id));
    });
    setPeerIdToCall("");
  };

  const leaveCall = () => {
    currentCallRefs.current.forEach(call => call.close());
    currentCallRefs.current = [];
    setRemoteStreams([]);
    if (myStream) myStream.getTracks().forEach(track => track.stop());
    setMyStream(null);
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    onLogout();
  };

  return (
    <div className="bestui-room-container">
      {/* Header */}
      <header className="bestui-header">
        <div className="bestui-userinfo">
          <FaUserCircle size={30} color="#444" style={{ marginRight: 10 }} />
          <div>
            <div className="bestui-username">{username || "User"}</div>
            <div className="bestui-peerid">
              Peer ID: <span>{myPeerId}</span>
              <button className="bestui-copy" onClick={() => myPeerId && copy(myPeerId)} title="Copy Peer ID">
                <FaCopy size={14} />
              </button>
            </div>
          </div>
        </div>
        <button className="bestui-logout" onClick={onLogout} title="Logout">
          <FaSignOutAlt size={22} />
        </button>
      </header>

      {/* Call panel */}
      <div className="bestui-callpanel">
        <input
          type="text"
          placeholder="Enter peer ID to call"
          value={peerIdToCall}
          onChange={e => setPeerIdToCall(e.target.value)}
          className="bestui-peerid-input"
        />
        <button className="bestui-call-btn" onClick={callPeer}>Call</button>
      </div>

      {/* Videos grid */}
      <div className={`bestui-videosgrid ${isScreenSharing ? "screensharing" : ""}`}>
        {myStream ?
          <div className="bestui-videotile">
            <VideoPlayer stream={myStream} isMuted={true} />
            <div className="bestui-label">You {muted && <FaMicrophoneSlash color="#f55" style={{ marginLeft: 4 }} />}</div>
          </div>
          : <div className="bestui-videotile">Connecting video...</div>
        }
        {remoteStreams.map((stream, i) => (
          <div className="bestui-videotile" key={i}>
            <VideoPlayer stream={stream} isMuted={false} />
            <div className="bestui-label">Guest</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bestui-toolbar">
        <button className={`bestui-toolbar-btn${muted ? " danger" : ""}`} onClick={toggleMute} title={muted ? "Unmute Mic" : "Mute Mic"}>
          {muted ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
        <button className={`bestui-toolbar-btn${videoOff ? " danger" : ""}`} onClick={toggleVideo} title={videoOff ? "Start Video" : "Stop Video"}>
          {videoOff ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button
          className="bestui-toolbar-btn info"
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          title={isScreenSharing ? "Stop Share" : "Share Screen"}
        >
          {isScreenSharing ? <FaStop /> : <FaDesktop />}
        </button>
        <button
          className="bestui-toolbar-btn leave"
          onClick={leaveCall}
          title="Leave Call"
        >
          <FaPhoneAlt />
        </button>
      </div>
    </div>
  );
};

export default Room;
