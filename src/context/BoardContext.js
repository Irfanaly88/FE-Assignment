import { createContext, useContext, useState, useEffect } from "react";

const BoardContext = createContext();

export const BoardProvider = ({ children }) => {
  const [lists, setLists] = useState([]);

  useEffect(() => {
    const savedBoard = localStorage.getItem("trelloBoard");
    if (savedBoard) setLists(JSON.parse(savedBoard));
  }, []);

  useEffect(() => {
    localStorage.setItem("trelloBoard", JSON.stringify(lists));
  }, [lists]);

  return (
    <BoardContext.Provider value={{ lists, setLists }}>
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => useContext(BoardContext);
