import { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "./abi.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const pokemonData = [
  { name: "Bulbasaur", image: "https://img.pokemondb.net/sprites/red-blue/normal/bulbasaur.png" },
  { name: "Ivysaur", image: "https://img.pokemondb.net/sprites/red-blue/normal/ivysaur.png" },
  { name: "Venusaur", image: "https://img.pokemondb.net/sprites/red-blue/normal/venusaur.png" },
  { name: "Charmander", image: "https://img.pokemondb.net/sprites/red-blue/normal/charmander.png" },
  { name: "Charmeleon", image: "https://img.pokemondb.net/sprites/red-blue/normal/charmeleon.png" },
  { name: "Charizard", image: "https://img.pokemondb.net/sprites/red-blue/normal/charizard.png" },
  { name: "Squirtle", image: "https://img.pokemondb.net/sprites/red-blue/normal/squirtle.png" },
  { name: "Wartortle", image: "https://img.pokemondb.net/sprites/red-blue/normal/wartortle.png" },
  { name: "Blastoise", image: "https://img.pokemondb.net/sprites/red-blue/normal/blastoise.png" }
];


function App() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState("0");
  const [pokedex, setPokedex] = useState([]);
  const [showPokedex, setShowPokedex] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(account);
    }
  };

  const disconnectWallet = () => {
  setWallet(null);
  setBalance("0");
  setPokedex([]);
};

  const fetchBalance = async () => {
    if (!wallet) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
      const rawBalance = await contract.balanceOf(wallet);
      const decimals = await contract.decimals();
      const formatted = ethers.formatUnits(rawBalance, decimals);
      setBalance(formatted);
    } catch (err) {
      console.error("❌ Error fetching balance:", err);
    }
  };

  const fetchPokedex = async () => {
  if (!wallet) return;
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

    console.log("📘 Fetching Pokédex for wallet:", wallet);
    const rawResult = await contract.getMyPokedex();
    const ids = [...rawResult];
    console.log("📘 Raw Pokédex IDs:", ids);
    setPokedex(ids.map((id) => Number(id)));
  } catch (err) {
    console.error("❌ Failed to fetch Pokédex:", err);
  }
};

  const capturePokemon = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

      const cost = await contract.captureCost();
      const allowance = await contract.allowance(wallet, CONTRACT_ADDRESS);

      if (allowance < cost) {
        console.log("🔐 Approving tokens...");
        const approvalTx = await contract.approve(CONTRACT_ADDRESS, cost);
        await approvalTx.wait();
        console.log("✅ Approval confirmed");
      }

      console.log("🎯 Capturing Pokémon...");
      const tx = await contract.capturePokemon();
      console.log("📦 TX Sent:", tx.hash);
      await tx.wait();

      console.log("✅ Capture successful!");
      await fetchBalance();
      await fetchPokedex();
    } catch (error) {
      console.error("❌ Error capturing Pokémon:", error);
    }
  };

  useEffect(() => {
  const init = async () => {
    if (typeof window.ethereum !== "undefined") {
      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(account);
    } else {
      console.error("❌ MetaMask not detected.");
    }
  };

  init();
}, []);

useEffect(() => {
  const init = async () => {
    if (typeof window.ethereum !== "undefined") {
      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(account);
    } else {
      console.error("❌ MetaMask not detected.");
    }
  };

  init();
}, []);

useEffect(() => {
  const loadData = async () => {
    if (!wallet) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

      const rawBalance = await contract.balanceOf(wallet);
      const decimals = await contract.decimals();
      const formatted = ethers.formatUnits(rawBalance, decimals);
      setBalance(formatted);

      const rawResult = await contract.getMyPokedex();
      const ids = [...rawResult];
      setPokedex(ids.map((id) => Number(id)));
    } catch (err) {
      console.error("❌ Error loading wallet data:", err);
    }
  };

  loadData();
}, [wallet]);

  return (
  <div style={{ padding: 20, fontFamily: "sans-serif" }}>
    <h1>
  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokéball" width="24" style={{ verticalAlign: "middle", marginRight: 8 }} />
  Pokemon Token
</h1>
    {!wallet ? (
      <button onClick={connectWallet}>Connect Wallet</button>
    ) : (
      <>
        <p><strong>Wallet:</strong> {wallet}</p>
        <p><strong>Balance:</strong> {balance} POKETEST2</p>
        <button onClick={capturePokemon}>Capture Pokémon</button>
        <button onClick={disconnectWallet}>Disconnect Wallet</button>
        <button onClick={fetchPokedex} style={{ marginTop: 10, marginBottom: 10 }}>
          Show My Pokédex
        </button>

        <h2>
  <img
    src="https://icon-library.com/images/pokedex-icon/pokedex-icon-28.jpg"
    alt="Pokédex"
    width="24"
    style={{ verticalAlign: "middle", marginRight: 8 }}
  />
  My Pokédex
</h2>
        {pokedex.length === 0 ? (
          <p>No Pokémon captured yet.</p>
        ) : (
          <ul>
            {Array.from(
              pokedex.reduce((acc, id) => {
                acc.set(id, (acc.get(id) || 0) + 1);
                return acc;
              }, new Map())
            )
              .sort((a, b) => a[0] - b[0]) // sort by Pokémon ID
              .map(([id, count], i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                  <img
                    src={pokemonData[id]?.image}
                    alt={pokemonData[id]?.name || "Unknown"}
                    width="32"
                    style={{ marginRight: 8 }}
                  />
                  #{id} – {pokemonData[id]?.name || "Unknown"}{count > 1 ? ` × ${count}` : ""}
                </li>
              ))}
          </ul>
        )}
      </>
    )}
  </div>
);

}

export default App;
