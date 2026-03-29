// Allow CSS imports from node_modules
declare module 'leaflet/dist/leaflet.css' {
  const styles: string;
  export default styles;
}
