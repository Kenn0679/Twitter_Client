import PropTypes from 'prop-types';
import '../App.css';

/**
 * VideoStream Component
 * Displays a progressive MP4 video with HTML5 video player
 *
 * @param {string} src - The URL of the video source
 * @param {string} title - The title to display above the video
 * @param {string} width - The width of the video player (default: 85%)
 */
export default function VideoStream({ src, title = 'Progressive Video Streaming', width = '85%' }) {
  return (
    <div className='video-demo-section'>
      <h2>
        🎬 {title}
        <span className='demo-badge'>MP4</span>
      </h2>
      <p style={{ color: '#888', marginBottom: '1rem' }}>Standard HTML5 video with progressive download</p>
      <video controls width={width}>
        <source src={src} type='video/mp4' />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

VideoStream.propTypes = {
  src: PropTypes.string.isRequired,
  title: PropTypes.string,
  width: PropTypes.string
};
