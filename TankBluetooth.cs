#if WINDOWS
using Windows.Devices.Bluetooth;
using Windows.Devices.Bluetooth.GenericAttributeProfile;
using Windows.Storage.Streams;

static class TankBluetooth
{
    public static async Task<GattServiceProvider> Start(string pin, Action feed, Action<string> report)
    {
        var adapter = await BluetoothAdapter.GetDefaultAsync();
        if (adapter?.IsPeripheralRoleSupported != true)
            throw new InvalidOperationException("Windows needs a BLE adapter with peripheral mode.");

        var service = await GattServiceProvider.CreateAsync(Guid.Parse("7f8e1000-94ec-41ed-bd90-67bc52b9aa21"));
        if (service.Error != BluetoothError.Success)
            throw new InvalidOperationException(service.Error.ToString());

        var provider = service.ServiceProvider;
        var command = await provider.Service.CreateCharacteristicAsync(
            Guid.Parse("7f8e1001-94ec-41ed-bd90-67bc52b9aa21"),
            new GattLocalCharacteristicParameters
            {
                CharacteristicProperties = GattCharacteristicProperties.Write,
                WriteProtectionLevel = GattProtectionLevel.Plain,
                UserDescription = "Aquarium feeding command"
            });
        if (command.Error != BluetoothError.Success)
            throw new InvalidOperationException(command.Error.ToString());

        command.Characteristic.WriteRequested += async (_, args) =>
        {
            var deferral = args.GetDeferral();
            try
            {
                var request = await args.GetRequestAsync();
                if (request is null) return;
                using var reader = DataReader.FromBuffer(request.Value);
                if (reader.UnconsumedBufferLength != 11 || reader.ReadString(11) != $"feed:{pin}")
                    request.RespondWithProtocolError(0x80);
                else
                {
                    feed();
                    request.Respond();
                }
            }
            catch (Exception error)
            {
                Console.Error.WriteLine($"Bluetooth write: {error.Message}");
            }
            finally
            {
                deferral.Complete();
            }
        };

        report("Bluetooth starting…");
        provider.AdvertisementStatusChanged += (_, args) =>
        {
            var error = args.Error == BluetoothError.Success ? "" : $" ({args.Error})";
            report($"Bluetooth {args.Status}{error}");
        };
        provider.StartAdvertising(new GattServiceProviderAdvertisingParameters
        {
            IsConnectable = true,
            IsDiscoverable = true
        });
        return provider;
    }
}
#endif
