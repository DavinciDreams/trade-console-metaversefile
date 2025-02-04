import metaversefile from "metaversefile";
const { useApp, useWorld, useActivate, useLoaders, usePhysics, useCleanup } =
  metaversefile;
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, "$1");

export default (e) => {
  const app = useApp();
  const physics = usePhysics();

  const minScale = 0;
  const maxScale = 2;
  const minPosition = 0;
  const maxPosition = 2;
  const lerpTime = 0.5;
  const lerpScale = (a, b, t) => a + (b - a) * t;
  const lerpPosition = (a, b, t) => a + (b - a) * t;

  let activated = false;

  app.name = "trade-console";

  window.openInWebaverse = (item) => {
    console.log("openInWebaverse: ", item);
    console.log("item url: ", item.url);
    metaversefile.createAppAsync({
      start_url: item.url,
      position: [app.position.x + Math.random() * .1, app.position.y+1+ Math.random() * .1, app.position.z+1+ Math.random() * .1],

      // 90 degree y rotation quaternion
      quaternion: [0, 0.7071067811865476, 0, 0.7071067811865475],
      scale: [0.5, 0.5, 0.5],
    }).then(newApp => {

      useWorld().appManager.importApp(newApp);
    })
  };

  const activateCb = () => {
    activated = !activated;
    const startTime = Date.now();
    let currentTime = 0;
    const timer = setInterval(() => {
      currentTime = Date.now();
      const time = (currentTime - startTime) / 1000;
      const scale = lerpScale(
        activated ? minScale : maxScale,
        activated ? maxScale : minScale,
        time / lerpTime
      );
      const position = lerpPosition(
        activated ? minPosition : maxPosition,
        activated ? maxPosition : minPosition,
        time / lerpTime
      );
      reactApp.scale.set(scale, scale, scale);
      reactApp.position.set(-0.5, position, reactApp.position.z);
      if (time > lerpTime) {
        const finalScale = activated ? maxScale : minScale;
        reactApp.scale.set(finalScale, finalScale, finalScale);
        clearInterval(timer);
      }
      reactApp.updateMatrixWorld();
    }, 1000 / 60);
  };

  useActivate(() => {
    activateCb && activateCb();
  });

  let live = true;
  let reactApp = null;
  const physicsIds = [];
  e.waitUntil(
    (async () => {
      const u = `${baseUrl}console_fantasy.glb`;
      let o = await new Promise((accept, reject) => {
        const { gltfLoader } = useLoaders();
        gltfLoader.load(u, accept, function onprogress() {}, reject);
      });
      if (!live) {
        o.destroy();
        return;
      }
      o = o.scene;
      app.add(o);

      {
        const u = `${baseUrl}/trade.react`;
        reactApp = await metaversefile.createAppAsync({
          start_url: u,
        });
        if (!live) {
          reactApp.destroy();
          return;
        }
        reactApp.rotation.y = Math.PI / 2;
        reactApp.scale.set(0, 0, 0);
        app.add(reactApp);
        reactApp.updateMatrixWorld();
      }

      const physicsId = physics.addGeometry(o);
      physicsIds.push(physicsId);
    })()
  );

  useCleanup(() => {
    live = false;
    reactApp && reactApp.destroy();
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};
