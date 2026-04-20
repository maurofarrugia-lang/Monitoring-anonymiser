<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ app_name }}</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <main class="container">
    <section class="hero">
      <h1>{{ app_name }}</h1>
      <p>Offline-first, local-only batch anonymisation for DOCX, PDF, TXT and XLSX case file materials.</p>
    </section>

    <section class="card">
      <h2>Upload folder contents</h2>
      <form action="/process" method="post" enctype="multipart/form-data">
        <label for="level">Anonymisation mode</label>
        <select id="level" name="level">
          <option value="light">Light</option>
          <option value="standard">Standard</option>
          <option value="demo-safe" selected>Demonstration-safe</option>
        </select>

        <label for="files">Files or full folder</label>
        <input id="files" type="file" name="files" multiple webkitdirectory directory>
        <p class="hint">Tip: in Chromium-based browsers, selecting a folder preserves relative paths.</p>

        <button type="submit">Process locally</button>
      </form>
    </section>

    {% if active_session %}
    <section class="card result">
      <div class="row between">
        <div>
          <h2>Session {{ active_session.id }}</h2>
          <p>Mode: <strong>{{ active_session.level }}</strong></p>
        </div>
        <div class="actions">
          <a class="button" href="/download/{{ active_session.id }}">Download ZIP bundle</a>
          <form action="/cleanup/{{ active_session.id }}" method="post">
            <button class="danger" type="submit">Delete session data</button>
          </form>
        </div>
      </div>

      <h3>Replacement statistics</h3>
      <div class="stats">
        {% for key, value in active_session.stats.items() %}
        <span class="pill">{{ key }}: {{ value }}</span>
        {% endfor %}
      </div>

      <h3>Processed files</h3>
      {% for item in active_session.files %}
      <article class="file-card">
        <h4>{{ item.source }}</h4>
        <div class="downloads">
          {% for path in item.outputs %}
            <a href="/download/{{ active_session.id }}/file?path={{ path | urlencode }}">{{ path }}</a>
          {% endfor %}
        </div>
        <details>
          <summary>Preview</summary>
          <pre>{{ item.preview }}</pre>
        </details>
      </article>
      {% endfor %}
    </section>
    {% endif %}
  </main>
</body>
</html>
