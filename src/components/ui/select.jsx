import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/utils";
import { ChevronDown } from "lucide-react";

const Select = ({ children, value, onValueChange, ...props }) => {
  return (
    <div className="relative" {...props}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { value, onValueChange })
      )}
    </div>
  );
};

const SelectTrigger = React.forwardRef(({ className, children, onValueChange, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </div>
));

SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder, ...props }) => {
  const { value, onValueChange } = props;
  return (
    <span className="truncate">
      {value || placeholder}
    </span>
  );
};

const SelectContent = React.forwardRef(({ className, children, onValueChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(props.value);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contentRef.current && !contentRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value) => {
    setSelectedValue(value);
    props.onValueChange?.(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={contentRef}>
      <div
        className={cn(
          "absolute top-full left-0 z-50 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          isOpen ? "block" : "hidden",
          className
        )}
        {...props}
      >
        {React.Children.map(children, child =>
          React.cloneElement(child, { onSelect: handleSelect, selectedValue })
        )}
      </div>
    </div>
  );
});

SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef(({ className, children, value, onSelect, selectedValue, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      selectedValue === value && "bg-accent text-accent-foreground",
      className
    )}
    onClick={() => onSelect?.(value)}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {selectedValue === value && "✓"}
    </span>
    {children}
  </div>
));

SelectItem.displayName = "SelectItem";

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
