const labels: Record<string, string> = { paper: "Paper", ink: "Ink", sand: "Sand", sage: "Sage", lavender: "Lavender" };

export function ThemePicker({ themes, defaultValue, error }: { themes: readonly string[]; defaultValue: string; error?: string }) {
  return <fieldset aria-describedby={error ? "theme-error" : undefined}>
    <legend className="label">Theme</legend>
    <div className="flex flex-wrap gap-4">{themes.map(theme => <label key={theme} className={`theme-swatch theme-${theme}`}>
      <input type="radio" name="theme" value={theme} defaultChecked={theme === defaultValue} className="sr-only"/>
      <span aria-hidden="true">Aa</span>
      <span>{labels[theme] ?? theme}</span>
    </label>)}</div>
    {error && <p id="theme-error" role="alert" className="mt-1 text-sm text-destructive">{error}</p>}
  </fieldset>;
}
