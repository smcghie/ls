import React from 'react';

interface ControlButtonsProps {
  isPaused: boolean;
  isLineVisible: boolean;
  handleToggleRestartAnimation: () => void;
  handleTogglePause: () => void;
  handleToggleVisibility: () => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({
  isPaused,
  isLineVisible,
  handleToggleRestartAnimation,
  handleTogglePause,
  handleToggleVisibility
}) => {
  return (
    <div className="flex space-x-4 rounded-full bg-tb-3 bg-opacity-50 p-2">
      <button onClick={handleToggleRestartAnimation} className="">
        <img
          src="/assets/restart.png"
          alt="Restart"
          className="w-8 h-8 drop-shadow"
        />
      </button>
      <button onClick={handleTogglePause} className="">
        {isPaused ? (
          <img
            src="/assets/play.png"
            alt="Play"
            className="w-8 h-8 drop-shadow"
          />
        ) : (
          <img
            src="/assets/pause.png"
            alt="Pause"
            className="w-8 h-8 drop-shadow"
          />
        )}
      </button>
      <button onClick={handleToggleVisibility} className="">
        {isLineVisible ? (
          <img
            src="/assets/hide.png"
            alt="Hide"
            className="w-8 h-8 drop-shadow"
          />
        ) : (
          <img
            src="/assets/show.png"
            alt="Show"
            className="w-8 h-8 drop-shadow"
          />
        )}
      </button>
    </div>
  );
};

export default ControlButtons;