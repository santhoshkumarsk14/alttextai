import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

const Tabs = ({ children, value, onValueChange, defaultValue, className = '' }) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue || '');

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    onValueChange && onValueChange(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab: value || activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ children, value, className = '' }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        activeTab === value
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-muted hover:text-foreground'
      } ${className}`}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ children, value, className = '' }) => {
  const { activeTab } = useContext(TabsContext);

  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };