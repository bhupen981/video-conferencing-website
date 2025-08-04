import { useEffect, useRef } from "react";
import Peer from "peerjs";

export function usePeer() {
  const peerInstance = useRef(null);

  useEffect(() => {
    peerInstance.current = new Peer(undefined, {
      host: process.env.REACT_APP_PEER_SERVER_HOST,
      port: Number(process.env.REACT_APP_PEER_SERVER_PORT),
      path: process.env.REACT_APP_PEER_SERVER_PATH,
    });

    peerInstance.current.on("open", (id) => {
      console.log("My peer ID is:", id);
    });

    peerInstance.current.on("error", (err) => {
      console.error(err);
    });

    return () => {
      if (peerInstance.current && !peerInstance.current.destroyed) {
        peerInstance.current.destroy();
      }
    };
  }, []);

  return peerInstance.current;
}
