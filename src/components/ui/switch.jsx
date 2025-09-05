import React, { useState } from 'react';

const Switch = ({ id, checked, onCheckedChange, disabled = false }) => {
  const [isChecked, setIsChecked] = useState(checked || false);

  const handleToggle = () => {
    if (disabled) return;

    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onCheckedChange && onCheckedChange(newChecked);
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isChecked ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isChecked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export { Switch };
