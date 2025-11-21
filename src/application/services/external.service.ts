import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const SOCIAL_SERVICE_URL = process.env.SOCIAL_SERVICE_URL || 'http://localhost:3002';

export class ExternalService {
    /**
     * Validate JWT token with Auth service
     */
    static async validateToken(token: string): Promise<boolean> {
        try {
            const response = await axios.post(
                `${AUTH_SERVICE_URL}/api/auth/validate-token`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 5000
                }
            );
            return response.data.valid === true;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    /**
     * Get user profile from Social service
     */
    static async getUserProfile(userId: string, token?: string): Promise<any> {
        try {
            const headers: any = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.get(
                `${SOCIAL_SERVICE_URL}/api/profiles/${userId}`,
                {
                    headers,
                    timeout: 5000
                }
            );
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            console.error('Get user profile error:', error);
            throw error;
        }
    }

    /**
     * Get multiple user profiles from Social service
     */
    static async getUserProfiles(userIds: string[], token?: string): Promise<any[]> {
        try {
            const headers: any = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.post(
                `${SOCIAL_SERVICE_URL}/api/profiles/batch`,
                { userIds },
                {
                    headers,
                    timeout: 5000
                }
            );
            return response.data || [];
        } catch (error) {
            console.error('Get user profiles error:', error);
            return [];
        }
    }

    /**
     * Verify media reference from Social service
     */
    static async verifyMediaReference(mediaId: string, token?: string): Promise<boolean> {
        try {
            const headers: any = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.get(
                `${SOCIAL_SERVICE_URL}/api/media/${mediaId}`,
                {
                    headers,
                    timeout: 5000
                }
            );
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

export default ExternalService;
