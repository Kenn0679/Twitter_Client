import PropTypes from 'prop-types';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import '../App.css';

/**
 * HLSVideoStream Component
 * Displays an HLS adaptive streaming video with Vidstack Media Player
 *
 * @param {string} src - The URL of the HLS manifest (m3u8 file)
 * @param {string} title - The title to display in the player and above the video
 * @param {string} thumbnails - The URL of the VTT thumbnails file (optional)
 * @param {string} sectionTitle - The section heading to display
 */
export default function HLSVideoStream({
  src,
  title = 'HLS Video',
  thumbnails,
  sectionTitle = 'HLS Adaptive Streaming'
}) {
  return (
    <div className='video-demo-section'>
      <h2>
        🚀 {sectionTitle}
        <span className='demo-badge hls-badge'>HLS</span>
      </h2>
      <p style={{ color: '#888', marginBottom: '1rem' }}>Advanced video player with adaptive bitrate streaming (HLS)</p>
      <div className='video-player-wrapper'>
        <MediaPlayer title={title} src={src}>
          <MediaProvider />
          <DefaultVideoLayout thumbnails={thumbnails} icons={defaultLayoutIcons} />
        </MediaPlayer>
      </div>
    </div>
  );
}

HLSVideoStream.propTypes = {
  src: PropTypes.string.isRequired,
  title: PropTypes.string,
  thumbnails: PropTypes.string,
  sectionTitle: PropTypes.string
};
