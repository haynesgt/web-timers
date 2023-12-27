export default function App() {
  return (
    <div>
      <h1>App</h1>
      <p>App content</p>
      <ul>
        {
          _.map([1, 2, 3], (n) => (
            <li>{n}</li>
          ))
        }
      </ul>
    </div>
  );
}
