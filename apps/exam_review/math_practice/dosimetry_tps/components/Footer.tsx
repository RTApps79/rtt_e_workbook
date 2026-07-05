
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="text-center mt-8 text-xs text-gray-600">
            <p className="font-bold text-gray-500 uppercase tracking-widest">RTApps ™</p>
            <p className="my-1">© {new Date().getFullYear()} Kevin Kindle</p>
            <p className="italic opacity-70">Educational simulation only. Reference: ARRT Content Specifications.</p>
        </footer>
    );
};

export default Footer;
