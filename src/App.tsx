import React from 'react';
import VideoPlayer from './components/VideoPlayer';

function App() {
  
  const videoSources = {
    '1080p': 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    '720p': 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    '480p': 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <VideoPlayer sources={videoSources} defaultQuality="720p" />
    </div>
  );
}

export default App;