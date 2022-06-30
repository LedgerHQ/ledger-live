jest.setTimeout(120 * 60 * 1000);

describe('Run simple bot', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show bot finished', async () => {
    await waitFor(element(by.id('done')))
      .toBeVisible()
      .withTimeout(500 * 60 * 1000);

    expect(element(by.id('done'))).toHaveText('finished');
  });
});
