import React, { useState, useRef, useEffect } from 'react';

const DropdownMenu = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

const DropdownMenuTrigger = ({ children, asChild }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={ref}>
      {React.cloneElement(children, {
        onClick: () => setIsOpen(!isOpen),
        'data-open': isOpen
      })}
      {isOpen && (
        <DropdownMenuContent align="end" onClose={() => setIsOpen(false)}>
          {children.props.children}
        </DropdownMenuContent>
      )}
    </div>
  );
};

const DropdownMenuContent = ({ children, align = 'start', onClose }) => {
  return (
    <div className={`absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-48 py-1 ${align === 'end' ? 'right-0' : 'left-0'}`}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          onClick: () => {
            child.props.onClick && child.props.onClick();
            onClose && onClose();
          }
        })
      )}
    </div>
  );
};

const DropdownMenuItem = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center ${className}`}
    >
      {children}
    </button>
  );
};

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };