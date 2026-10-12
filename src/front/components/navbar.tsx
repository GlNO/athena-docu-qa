
import { useState } from 'react';
import appLogo from '../assets/images/athena_app.png';
import '../styles/navbar.css';

export default function Navbar(){

      const [isMenuOpen, setIsMenuOpen] = useState(false);

      const closeMenu = () => {
            setIsMenuOpen(false);
      };
     

      return (

            <nav className="navbar">
                  <div className="navbar-inner">

                        <a className="navbar-logo" href="#home">
                              <img src={appLogo} alt="Athena App Logo" />
                        </a>

                        <button     
                              className={`navbar-toggle${isMenuOpen ? ' is-open' : ''}`}
                              type="button"
                              aria-expanded={isMenuOpen}
                              aria-controls="navbar-links"
                              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                              onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
                        >
                              <span />
                              <span />
                              <span />
                        </button>

                        <div className={`navbar-links${isMenuOpen ? ' is-open' : ''}`} id="navbar-links">
                              <a href="#upload-pdf" onClick={closeMenu}>Workspace</a>
                              {/* <a href="#about" onClick={closeMenu}>Upload PDF</a> */}
                              <a href="#about" onClick={closeMenu}>About</a>
                              <a href="https://github.com/GlNO/athena-docu-qa" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>GitHub</a>
                              
      
                        </div>
                  </div>
            
            </nav>


      );


}