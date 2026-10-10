
import '../styles/About.css';


export default function About() {
	return (
		<section id="about" className="about-section" aria-labelledby="about-title">
			<div className="about-container">
				<div className="about-intro">
					<p className="about-eyebrow">About Athena</p>
					<h2 id="about-title">An AI-powered Document Q&amp;A application.</h2>
					<p className="about-description">
						Athena lets you upload text-based PDF documents and ask questions
						about their contents. It uses AI to generate context-aware answers
						grounded in the information found in your document.
					</p>
				</div>

				<div className="about-details">
					<div className="about-features">
						<h3>What you can do</h3>
						<ul>
							<li>Upload text-based PDF documents</li>
							<li>Ask questions about document contents</li>
							<li>Generate context-aware answers using an AI model</li>
							<li>Get answers grounded in the uploaded document</li>
						</ul>
					</div>

					<div className="about-purpose">
						<h3>Project purpose</h3>
						<p>
							Athena is a personal portfolio project built to explore
							AI-powered applications, document processing, and
							retrieval-augmented generation (RAG).
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
