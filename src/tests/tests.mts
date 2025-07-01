import { chromium } from 'playwright';
import path from 'path';


(async () => {
  const extensionPath = path.resolve('./dist');
  const userDataDir = './src/tests/tmp-profile';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  const extensionId = 'khhfdlfbbkmlppmcalhncemigmebjjjp';
  const mainUrl = `chrome-extension://${extensionId}/src/main.html`;

  const page = await context.newPage();
  await page.goto(mainUrl);

  // Tests to verify 

})();
