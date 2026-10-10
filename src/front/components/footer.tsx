import { useState, useEffect, type MouseEvent } from 'react'

import '../styles/footer.css'

export default function Footer() {
	const [isAtTop, setIsAtTop] = useState(true)

	const scrollToTop = (event: MouseEvent<HTMLAnchorElement>) => {
		event.preventDefault()
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	useEffect(() => {
		const updateScrollState = () => {
			setIsAtTop(window.scrollY <= 4)
		}

		updateScrollState()
		window.addEventListener('scroll', updateScrollState, { passive: true })

		return () => window.removeEventListener('scroll', updateScrollState)
	}, [])

	return (
		<>
			<footer className="footer">
				<div className="footer-inner">
				

					<span className="footer-copyright">
						© {new Date().getFullYear()} Athena. All Rights Reserved.
					</span>
				</div>
			</footer>

			<a
				className={`back-to-top${isAtTop ? ' is-hidden' : ''}`}
				href="#"
				onClick={scrollToTop}
				aria-label="Back to top"
				title="Back to top"
			>
				<span aria-hidden="true">↑</span>
			</a>
		</>
	)
}