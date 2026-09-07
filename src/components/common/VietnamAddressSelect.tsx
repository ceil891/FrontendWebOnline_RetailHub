import React, { useState, useEffect } from 'react';
import { FALLBACK_PROVINCES, ApiProvince, ApiDistrict, ApiWard } from '../../data/vietnamLocations';
import { MapPin } from 'lucide-react';

interface VietnamAddressSelectProps {
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  onChange: (addr: { province: string; district: string; ward: string; street: string }) => void;
  className?: string;
}

export const VietnamAddressSelect: React.FC<VietnamAddressSelectProps> = ({
  province = 'Thành phố Hồ Chí Minh',
  district = 'Quận 1',
  ward = 'Phường Bến Thành',
  street = '',
  onChange,
  className = '',
}) => {
  const [provincesList, setProvincesList] = useState<ApiProvince[]>(FALLBACK_PROVINCES);
  const [districtsList, setDistrictsList] = useState<ApiDistrict[]>([]);
  const [wardsList, setWardsList] = useState<ApiWard[]>([]);

  const [selectedProvinceName, setSelectedProvinceName] = useState(province);
  const [selectedDistrictName, setSelectedDistrictName] = useState(district);
  const [selectedWardName, setSelectedWardName] = useState(ward);
  const [streetDetail, setStreetDetail] = useState(street);

  // Sync incoming props
  useEffect(() => {
    if (province) setSelectedProvinceName(province);
  }, [province]);

  useEffect(() => {
    if (district) setSelectedDistrictName(district);
  }, [district]);

  useEffect(() => {
    if (ward) setSelectedWardName(ward);
  }, [ward]);

  useEffect(() => {
    if (street !== undefined) setStreetDetail(street);
  }, [street]);

  // Try fetching latest provinces online, fallback to FALLBACK_PROVINCES
  useEffect(() => {
    let isMounted = true;
    fetch('https://provinces.open-api.vn/api/p/')
      .then((res) => res.json())
      .then((data: ApiProvince[]) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setProvincesList(data);
        }
      })
      .catch(() => {
        if (isMounted) setProvincesList(FALLBACK_PROVINCES);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update districts when selected province changes
  useEffect(() => {
    if (!selectedProvinceName) {
      setDistrictsList([]);
      return;
    }

    const matchedProvince = provincesList.find(
      (p) => p.name.toLowerCase() === selectedProvinceName.toLowerCase() ||
             p.name.toLowerCase().includes(selectedProvinceName.toLowerCase()) ||
             selectedProvinceName.toLowerCase().includes(p.name.toLowerCase())
    );

    if (matchedProvince) {
      if (matchedProvince.districts && matchedProvince.districts.length > 0) {
        setDistrictsList(matchedProvince.districts);
      } else {
        fetch(`https://provinces.open-api.vn/api/p/${matchedProvince.code}?depth=2`)
          .then((res) => res.json())
          .then((data) => {
            if (data.districts && Array.isArray(data.districts)) {
              setDistrictsList(data.districts);
            }
          })
          .catch(() => {
            const fb = FALLBACK_PROVINCES.find(p => p.code === matchedProvince.code);
            setDistrictsList(fb?.districts || []);
          });
      }
    }
  }, [selectedProvinceName, provincesList]);

  // Update wards when selected district changes
  useEffect(() => {
    if (!selectedDistrictName || districtsList.length === 0) {
      setWardsList([]);
      return;
    }

    const matchedDistrict = districtsList.find(
      (d) => d.name.toLowerCase() === selectedDistrictName.toLowerCase() ||
             d.name.toLowerCase().includes(selectedDistrictName.toLowerCase()) ||
             selectedDistrictName.toLowerCase().includes(d.name.toLowerCase())
    );

    if (matchedDistrict) {
      if (matchedDistrict.wards && matchedDistrict.wards.length > 0) {
        setWardsList(matchedDistrict.wards);
      } else {
        fetch(`https://provinces.open-api.vn/api/d/${matchedDistrict.code}?depth=2`)
          .then((res) => res.json())
          .then((data) => {
            if (data.wards && Array.isArray(data.wards)) {
              setWardsList(data.wards);
            }
          })
          .catch(() => {});
      }
    }
  }, [selectedDistrictName, districtsList]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provName = e.target.value;
    setSelectedProvinceName(provName);

    const matched = provincesList.find(p => p.name === provName);
    const firstDistrict = matched?.districts?.[0]?.name || '';
    const firstWard = matched?.districts?.[0]?.wards?.[0]?.name || '';

    setSelectedDistrictName(firstDistrict);
    setSelectedWardName(firstWard);

    onChange({
      province: provName,
      district: firstDistrict,
      ward: firstWard,
      street: streetDetail,
    });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distName = e.target.value;
    setSelectedDistrictName(distName);

    const matched = districtsList.find(d => d.name === distName);
    const firstWard = matched?.wards?.[0]?.name || '';
    setSelectedWardName(firstWard);

    onChange({
      province: selectedProvinceName,
      district: distName,
      ward: firstWard,
      street: streetDetail,
    });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wName = e.target.value;
    setSelectedWardName(wName);
    onChange({
      province: selectedProvinceName,
      district: selectedDistrictName,
      ward: wName,
      street: streetDetail,
    });
  };

  const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStreetDetail(val);
    onChange({
      province: selectedProvinceName,
      district: selectedDistrictName,
      ward: selectedWardName,
      street: val,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tỉnh / Thành phố */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tỉnh / Thành phố <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedProvinceName}
            onChange={handleProvinceChange}
            className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 shadow-sm"
          >
            <option value="">-- Chọn Tỉnh / Thành phố --</option>
            {provincesList.map((p) => (
              <option key={p.code} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quận / Huyện */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Quận / Huyện <span className="text-rose-500">*</span>
          </label>
          {districtsList.length > 0 ? (
            <select
              value={selectedDistrictName}
              onChange={handleDistrictChange}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 shadow-sm"
            >
              <option value="">-- Chọn Quận / Huyện --</option>
              {districtsList.map((d) => (
                <option key={d.code} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Nhập Quận / Huyện..."
              value={selectedDistrictName}
              onChange={(e) => {
                setSelectedDistrictName(e.target.value);
                onChange({
                  province: selectedProvinceName,
                  district: e.target.value,
                  ward: selectedWardName,
                  street: streetDetail,
                });
              }}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
            />
          )}
        </div>

        {/* Phường / Xã */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Phường / Xã
          </label>
          {wardsList.length > 0 ? (
            <select
              value={selectedWardName}
              onChange={handleWardChange}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 shadow-sm"
            >
              <option value="">-- Chọn Phường / Xã --</option>
              {wardsList.map((w) => (
                <option key={w.code} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Nhập Phường / Xã..."
              value={selectedWardName}
              onChange={(e) => {
                setSelectedWardName(e.target.value);
                onChange({
                  province: selectedProvinceName,
                  district: selectedDistrictName,
                  ward: e.target.value,
                  street: streetDetail,
                });
              }}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900"
            />
          )}
        </div>
      </div>

      {/* Số nhà / Địa chỉ chi tiết */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà...) <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Ví dụ: Số 123 Nguyễn Trãi, Tòa nhà Bitexco..."
            value={streetDetail}
            onChange={handleStreetChange}
            required
            className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};
