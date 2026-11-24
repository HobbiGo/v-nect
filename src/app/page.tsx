
const modules = [
  {
    number: "01",
    name: "VOIN Chat",
    description: "Connect and communicate with people and businesses.",
  },
  {
    number: "02",
    name: "VOIN Connect",
    description: "Voice, video meetings and global collaboration.",
  },
  {
    number: "03",
    name: "VOIN Business",
    description: "Build your professional and company identity.",
  },
  {
    number: "04",
    name: "Business Feed",
    description: "Discover business updates, news and opportunities.",
  },
  {
    number: "05",
    name: "VOIN Community",
    description: "Meet professionals and grow your network.",
  },
  {
    number: "06",
    name: "VOIN Marketplace",
    description: "Discover products, services and suppliers.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="navbar">
        <a className="logo" href="#">
          VOIN<span>NECT</span>
          <small>GLOBAL BUSINESS ECOSYSTEM</small>
        </a>

        <nav>
          <a href="#platform">Platform</a>
          <a href="#business">Business</a>
          <a href="#about">About</a>
        </nav>

        <a className="nav-button" href="#get-started">
          Get Started ↗
        </a>
      </header>

      <section className="hero" id="about">
        <div className="hero-content">
          <div className="eyebrow">
            GLOBAL BUSINESS COMMUNICATION PLATFORM
          </div>

          <h1>
            Connect Beyond
            <span> Boundaries.</span>
          </h1>

          <p>
            One connected ecosystem for communication,
            collaboration, business networking and global
            opportunities.
          </p>

          <div className="hero-actions" id="get-started">
            <a className="primary-button" href="#platform">
              Explore Platform ↗
            </a>
            <a className="secondary-button" href="#business">
              Discover VOINNECT
            </a>
          </div>

          <div className="hero-caption">
            ONE ACCOUNT. ONE ECOSYSTEM. GLOBAL CONNECTIONS.
          </div>
        </div>

        <div className="hero-visual">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />

          <div className="core">
            <div className="core-inner">
              <span>V</span>
            </div>
          </div>

          <div className="orbit-label label-one">BUSINESS</div>
          <div className="orbit-label label-two">CONNECT</div>
          <div className="orbit-label label-three">COMMUNITY</div>
          <div className="orbit-label label-four">GLOBAL</div>
        </div>
      </section>

      <section className="platform-section" id="platform">
        <div className="section-heading">
          <span>THE VOINNECT ECOSYSTEM</span>
          <h2>Everything Connected.</h2>
          <p>
            A unified digital environment designed to
            bring businesses and people closer.
          </p>
        </div>

        <div className="module-grid">
          {modules.map((module) => (
            <article className="module-card" key={module.number}>
              <span className="module-number">{module.number}</span>
              <h3>{module.name}</h3>
              <p>{module.description}</p>
              <span className="module-arrow">↗</span>
            </article>
          ))}
        </div>
      </section>

      <section className="business-section" id="business">
        <span>BUILT FOR A CONNECTED WORLD</span>
        <h2>
          Your Business.
          <br />
          Your Network.
          <br />
          Your Opportunities.
        </h2>
        <p>
          VOINNECT — Building a More Connected Business World.
        </p>
      </section>

      <footer className="footer">
        <div className="logo">
          VOIN<span>NECT</span>
        </div>
        <p>Connect Beyond Boundaries.</p>
        <small>© 2026 VOINNECT. All rights reserved.</small>
      </footer>
    </main>
  );
}
