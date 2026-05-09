import { PreviewStage } from './components/PreviewStage';

export default function Page() {
  return (
    <main className="shell">
      <header className="masthead">
        <div className="masthead__brand reveal reveal--1">
          video-as-code <em>/ for agents</em>
        </div>
        <div className="masthead__meta mono reveal reveal--2">
          <span>DEMO REEL № 01</span>
          <span>VOL. 24 FPS</span>
          <span>2026</span>
        </div>
      </header>

      <article className="article">
        <section className="lede">
          <div className="lede__eyebrow mono reveal reveal--2">
            FEATURED COMPOSITION
          </div>
          <h1 className="lede__title reveal reveal--3">
            Aaron
            <br />
            <em>Epstein</em>
          </h1>
          <p className="lede__dek reveal reveal--4">
            A four-second wipe-in lower-third followed by a typewritten orange
            highlight — both rendered from React components, then mounted in a
            Remotion player without leaving the browser.
          </p>
          <dl className="lede__specs mono reveal reveal--5">
            <dt>FPS</dt><dd>24</dd>
            <dt>RES</dt><dd>1080 × 720</dd>
            <dt>RUN</dt><dd>0:08</dd>
            <dt>SRC</dt><dd>&lt;Preview&gt;</dd>
          </dl>
        </section>

        <section className="stage-wrap bloom">
          <PreviewStage />
        </section>
      </article>

      <footer className="colophon">
        <span>Made with video-as-code-for-agents</span>
        <code className="colophon__install">
          npm i <em>video-as-code-for-agents</em>
        </code>
      </footer>
    </main>
  );
}
