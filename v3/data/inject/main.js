{
  /* port is used to communicate between chrome and page scripts */
  let port;
  try {
    port = document.getElementById('ghj2rt-port');
    port.remove();
  }
  catch (e) {
    port = document.createElement('span');
    port.id = 'ghj2rt-port';
    document.documentElement.append(port);
  }


  window['_gaUserPrefs'] = {
    ioo() {
      port.dispatchEvent(new Event('ga-count'));
      return true;
    }
  };
}
