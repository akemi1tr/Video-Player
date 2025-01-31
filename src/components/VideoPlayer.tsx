import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Volume1,
  Volume,
  SkipForward, 
  SkipBack, 
  FastForward,
  Loader,
  Settings,
  Maximize,
  Minimize,
  ChevronDown,
  RotateCcw,
  Repeat,
  Image,
  MonitorPlay
} from 'lucide-react';

interface VideoPlayerProps {
  sources: {
    [key: string]: string;
  };
  defaultQuality: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ sources, defaultQuality }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentQuality, setCurrentQuality] = useState(defaultQuality);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'speed' | 'quality'>('speed');
  const [isLooping, setIsLooping] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailPosition, setThumbnailPosition] = useState(0);
  const [isVolumeHovered, setIsVolumeHovered] = useState(false);
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [thumbnailCanvas, setThumbnailCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number>();
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const thumbnailRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);
  }, []);

  const generateThumbnail = useCallback((time: number) => {
    if (!videoRef.current || !thumbnailRef.current) return;

    const video = videoRef.current;
    const canvas = thumbnailRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = 160;
    canvas.height = 90;

    const currentVideoTime = video.currentTime;
    video.currentTime = time;

    video.onseeked = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      video.currentTime = currentVideoTime;
    };
  }, []);

  useEffect(() => {
    if (showThumbnail && videoRef.current) {
      const time = (thumbnailPosition / 100) * (videoRef.current.duration || 0);
      setThumbnailTime(time);
      generateThumbnail(time);
    }
  }, [thumbnailPosition, showThumbnail, generateThumbnail]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowleft':
          skip(-10);
          break;
        case 'arrowright':
          skip(10);
          break;
        case 't':
          toggleTheaterMode();
          break;
        case 'l':
          toggleLoop();
          break;
        case 'arrowup':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      const currentVideoTime = videoRef.current.currentTime;
      videoRef.current.src = sources[currentQuality];
      videoRef.current.currentTime = currentVideoTime;
      if (isPlaying) {
        videoRef.current.play();
      }
    }
  }, [currentQuality, sources]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
       
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(error => {
              console.error("Playback failed:", error);
              setIsPlaying(false);
            });
          return;
        }
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Video playback error:", error);
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const adjustVolume = (delta: number) => {
    if (videoRef.current) {
      const newVolume = Math.max(0, Math.min(1, volume + delta));
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleLoop = () => {
    if (videoRef.current) {
      videoRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  };

  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
    if (playerRef.current) {
      playerRef.current.classList.toggle('max-w-full');
      playerRef.current.classList.toggle('max-w-3xl');
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const buffered = videoRef.current.buffered;
      if (buffered.length > 0) {
        setIsBuffering(videoRef.current.currentTime > buffered.end(buffered.length - 1));
      }
    }
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  const handlePlaying = () => {
    setIsBuffering(false);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;
      setThumbnailPosition(position);
      setShowThumbnail(true);
    }
  };

  const handleProgressLeave = () => {
    setShowThumbnail(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const percentage = (clickPosition / rect.width) * 100;
      const newTime = (percentage / 100) * videoRef.current.duration;
      
      videoRef.current.currentTime = newTime;
      setProgress(percentage);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSettingsMenu(false);
    }
  };

  const changeQuality = (quality: string) => {
    setCurrentQuality(quality);
    setShowSettingsMenu(false);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (isIOS) {
      
      if (videoRef.current.webkitEnterFullscreen) {
        videoRef.current.webkitEnterFullscreen();
      }
    } else {
      
      if (!document.fullscreenElement) {
        playerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-6 h-6 text-white" />;
    if (volume < 0.3) return <Volume className="w-6 h-6 text-white" />;
    if (volume < 0.7) return <Volume1 className="w-6 h-6 text-white" />;
    return <Volume2 className="w-6 h-6 text-white" />;
  };

  return (
    <div 
      ref={playerRef}
      className={`${isTheaterMode ? 'max-w-full' : 'max-w-3xl'} mx-auto bg-gray-900 rounded-lg overflow-hidden shadow-xl relative group`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onProgress={handleProgress}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onClick={togglePlay}
        src={sources[currentQuality]}
        loop={isLooping}
        preload="metadata"
        playsInline={true}
        webkit-playsinline="true"
        controls={isIOS}
        {...(isIOS && {
          'x-webkit-airplay': "allow",
          controlsList: "nodownload"
        })}
      />

      <canvas
        ref={thumbnailRef}
        className="hidden"
      />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <Loader className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {showThumbnail && (
        <div 
          className="absolute bottom-16 bg-black rounded-lg shadow-lg overflow-hidden"
          style={{ left: `${thumbnailPosition}%`, transform: 'translateX(-50%)' }}
        >
          <canvas
            ref={thumbnailRef}
            className="w-40 h-[90px]"
          />
          <div className="text-white text-sm text-center p-1 bg-black/80">
            {formatTime(thumbnailTime)}
          </div>
        </div>
      )}

      {!isIOS && (
        <>
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} />

          <div className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div
              ref={progressRef}
              className="h-1 bg-gray-700 rounded-full mb-4 cursor-pointer relative"
              onClick={handleProgressClick}
              onMouseMove={handleProgressHover}
              onMouseLeave={handleProgressLeave}
            >
              <div
                className="absolute h-full bg-green-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute h-3 w-3 bg-green-500 rounded-full -top-1"
                style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>

                <button
                  onClick={() => skip(-10)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  title="Skip backward 10 seconds (←)"
                >
                  <SkipBack className="w-6 h-6 text-white" />
                </button>

                <button
                  onClick={() => skip(10)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  title="Skip forward 10 seconds (→)"
                >
                  <SkipForward className="w-6 h-6 text-white" />
                </button>

                <div className="flex items-center gap-2 group/volume relative"
                     onMouseEnter={() => setIsVolumeHovered(true)}
                     onMouseLeave={() => setIsVolumeHovered(false)}>
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                  >
                    {getVolumeIcon()}
                  </button>
                  <div className={`flex items-center transition-all duration-200 ${isVolumeHovered ? 'w-24 opacity-100' : 'w-0 opacity-0'}`}>
                    <div className="w-full px-2">
                      <div className="relative w-full h-1 bg-gray-700 rounded-full">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={handleVolumeChange}
                          className="absolute w-full h-full opacity-0 cursor-pointer"
                          title="Volume (↑/↓)"
                        />
                        <div
                          className="absolute h-full bg-green-500 rounded-full"
                          style={{ width: `${volume * 100}%` }}
                        />
                        <div
                          className="absolute h-3 w-3 bg-green-500 rounded-full -top-1 transform -translate-y-1/4"
                          style={{ left: `${volume * 100}%`, transform: 'translateX(-50%)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleLoop}
                  className={`p-2 hover:bg-gray-800 rounded-full transition-colors ${isLooping ? 'bg-green-500' : ''}`}
                  title="Toggle loop (L)"
                >
                  <Repeat className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={toggleTheaterMode}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  title="Theater mode (T)"
                >
                  <MonitorPlay className="w-5 h-5 text-white" />
                </button>

                <div className="relative" ref={settingsMenuRef}>
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="flex items-center gap-1 px-3 py-1 hover:bg-gray-800 rounded-full transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5 text-white" />
                    <span className="text-white text-sm">
                      {settingsTab === 'speed' ? `${playbackSpeed}x` : currentQuality}
                    </span>
                  </button>
                  {showSettingsMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden min-w-[160px]">
                      <div className="flex border-b border-gray-700">
                        <button
                          onClick={() => setSettingsTab('speed')}
                          className={`flex-1 px-4 py-2 text-white ${settingsTab === 'speed' ? 'bg-green-600' : 'hover:bg-gray-700'}`}
                        >
                          Speed
                        </button>
                        <button
                          onClick={() => setSettingsTab('quality')}
                          className={`flex-1 px-4 py-2 text-white ${settingsTab === 'quality' ? 'bg-green-600' : 'hover:bg-gray-700'}`}
                        >
                          Quality
                        </button>
                      </div>
                      {settingsTab === 'speed' ? (
                        <div>
                          {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => changeSpeed(speed)}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-700 text-white ${
                                playbackSpeed === speed ? 'bg-green-600' : ''
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div>
                          {Object.keys(sources).map((quality) => (
                            <button
                              key={quality}
                              onClick={() => changeQuality(quality)}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-700 text-white ${
                                currentQuality === quality ? 'bg-green-600' : ''
                              }`}
                            >
                              {quality}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  title="Toggle fullscreen (F)"
                >
                  {isFullscreen ? (
                    <Minimize className="w-6 h-6 text-white" />
                  ) : (
                    <Maximize className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;