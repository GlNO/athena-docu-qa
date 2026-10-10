import '../styles/Hero.css';
import athenaStatue from '../assets/images/athena_statue.png';


export default function Hero() {
  return (
    <section className="hero-section" id="home">
      <div className="hero-content">
        <h1 className="hero-title">
         <span>Athena</span> | Knowledge, within reach.
        </h1>

        <h2 className="hero-subtitle">
          Ask questions. Find understanding.
        </h2>
        <p className="hero-description">
          Explore your PDFs, and uncover the information that matters.
        </p>


        <div className="btn">

          <a href="#upload-pdf" className="hero-button">
            UPLOAD A PDF
          </a>
          
        </div>
      </div>
      <img
        className="hero-statue"
        src={athenaStatue}
        alt="Athena statue holding a shield and spear"
      />
    </section>
  );
}
