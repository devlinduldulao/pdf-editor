import React from 'react';
import '../styles/MenuBar.css';

interface MenuBarProps {
    onSave: () => void;
    onSaveAs: () => void;
    onNew: () => void;
    hasDocument: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({ onSave, onSaveAs, onNew, hasDocument }) => {
    return (
        <div className="menu-bar">
            <div className="menu-bar-left">
                <h1 className="app-title">PDF Editor</h1>
            </div>
            <div className="menu-bar-right">
                <button
                    className="menu-btn"
                    onClick={onNew}
                >
                    📄 New
                </button>
                <button
                    className="menu-btn"
                    onClick={onSave}
                    disabled={!hasDocument}
                >
                    💾 Save
                </button>
                <button
                    className="menu-btn"
                    onClick={onSaveAs}
                    disabled={!hasDocument}
                >
                    📋 Save As
                </button>
            </div>
        </div>
    );
};

export default MenuBar;
