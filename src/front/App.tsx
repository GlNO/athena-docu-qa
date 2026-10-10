

import AppNavbar from './components/navbar';


import Hero from './sections/Hero';
import About from './sections/About';
import FileUpload from './components/upload/FileUpload';


import AppFooter from './components/footer';

function App() {


  return (
    <>
     <main>
      <AppNavbar/>
      <Hero/>
      <About/>
      <FileUpload/>
     </main>
     <AppFooter/>
    </>
  )
}

export default App
